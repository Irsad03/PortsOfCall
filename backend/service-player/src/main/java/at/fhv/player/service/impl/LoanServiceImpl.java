package at.fhv.player.service.impl;

import at.fhv.player.dto.CreditAssessmentDTO;
import at.fhv.player.dto.LoanApplicationResponseDTO;
import at.fhv.player.dto.LoanDTO;
import at.fhv.player.dto.LoanQuoteDTO;
import at.fhv.player.dto.LoanTransactionDTO;
import at.fhv.player.exception.BusinessRuleViolationException;
import at.fhv.player.exception.EntityNotFoundException;
import at.fhv.player.exception.InsufficientFundsException;
import at.fhv.player.model.Loan;
import at.fhv.player.model.LoanStatus;
import at.fhv.player.model.LoanTransaction;
import at.fhv.player.model.LoanTransactionType;
import at.fhv.player.model.Player;
import at.fhv.player.repository.LoanRepository;
import at.fhv.player.repository.LoanTransactionRepository;
import at.fhv.player.repository.PlayerRepository;
import at.fhv.player.service.BankService;
import at.fhv.player.service.LoanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LoanServiceImpl implements LoanService {

    private static final Logger log = LoggerFactory.getLogger(LoanServiceImpl.class);

    // A loan stays collectable until it's fully PAID_OFF — DEFAULTED included.
    // A defaulted loan must never "escape": it keeps counting as debt and the
    // auto-debit keeps pulling instalments the moment the player has cash again.
    private static final List<LoanStatus> PAYABLE =
            List.of(LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.DEFAULTED);

    private final PlayerRepository           playerRepository;
    private final LoanRepository             loanRepository;
    private final LoanTransactionRepository  loanTransactionRepository;
    private final BankService                bankService;

    /** Extra interest added to the balance for each tick a payment is missed. */
    @Value("${loan.overdue.penalty-rate:0.05}")
    private double overduePenaltyRate;

    /** Consecutive overdue ticks after which a loan defaults. */
    @Value("${loan.overdue.max-ticks:5}")
    private int maxOverdueTicks;

    /** Hard ceiling for a never-paid loan's balance, as a multiple of the original
     *  total owed. Penalty interest stops compounding once this cap is reached, so
     *  a defaulted debt can't grow into absurd numbers (but still hurts). */
    @Value("${loan.overdue.penalty-cap-multiple:2.0}")
    private double penaltyCapMultiple;

    public LoanServiceImpl(PlayerRepository playerRepository,
                           LoanRepository loanRepository,
                           LoanTransactionRepository loanTransactionRepository,
                           BankService bankService) {
        this.playerRepository          = playerRepository;
        this.loanRepository            = loanRepository;
        this.loanTransactionRepository = loanTransactionRepository;
        this.bankService               = bankService;
    }

    // ── Quote ───────────────────────────────────────────────────────────────
    @Override
    public LoanQuoteDTO quoteLoan(String playerId, int amount, int termTicks) {
        CreditAssessmentDTO credit = bankService.assessCredit(playerId);
        int    term    = normalizeTerm(termTicks);
        double rate    = bankService.interestRateFor(credit.getCreditRating(), term);
        int    maxLoan = credit.getMaxLoan();

        int totalRepayable = (int) Math.round(amount * (1.0 + rate));
        int tickPayment    = term > 0 ? (int) Math.ceil((double) totalRepayable / term) : totalRepayable;

        LoanQuoteDTO q = new LoanQuoteDTO();
        q.setAmount(amount);
        q.setTermTicks(term);
        q.setInterestRate(rate);
        q.setMaxLoan(maxLoan);
        q.setCreditRating(credit.getCreditRating());
        q.setTotalRepayable(totalRepayable);
        q.setTickPayment(tickPayment);

        if (hasArrears(playerId)) {
            q.setApproved(false);
            q.setReason("You have an overdue or defaulted loan. Settle your outstanding debt before borrowing again.");
        } else if (amount <= 0) {
            q.setApproved(false);
            q.setReason("Please choose an amount greater than zero.");
        } else if (maxLoan < BankServiceImpl.MIN_LOAN) {
            q.setApproved(false);
            q.setReason("I'm afraid your current credit standing doesn't qualify you for a loan right now.");
        } else if (amount > maxLoan) {
            q.setApproved(false);
            q.setReason("That exceeds your credit limit of €" + maxLoan + ".");
        } else {
            q.setApproved(true);
            q.setReason("Approved.");
        }
        return q;
    }

    // ── Application ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public LoanApplicationResponseDTO applyForLoan(String playerId, int amount, int termTicks, int currentTick) {
        LoanQuoteDTO quote = quoteLoan(playerId, amount, termTicks);
        if (!quote.isApproved()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, quote.getReason());
        }

        Player player = requirePlayer(playerId);
        player.setMoney(player.getMoney() + amount);
        playerRepository.save(player);

        int term = quote.getTermTicks();
        Loan loan = new Loan(playerId, amount, quote.getInterestRate(),
                quote.getTotalRepayable(), quote.getTickPayment(), term,
                currentTick, currentTick + term);
        loanRepository.save(loan);

        recordTx(loan, currentTick, LoanTransactionType.DISBURSEMENT, amount, "Loan disbursed");

        int totalInterest = quote.getTotalRepayable() - amount;
        return new LoanApplicationResponseDTO(toDTO(loan), quote.getTickPayment(), totalInterest);
    }

    // ── Reads ───────────────────────────────────────────────────────────────
    @Override
    public List<LoanDTO> getLoans(String playerId, LoanStatus status) {
        List<Loan> loans = (status == null)
                ? loanRepository.findByPlayerId(playerId)
                : loanRepository.findByPlayerIdAndStatus(playerId, status);
        return loans.stream().map(this::toDTO).toList();
    }

    @Override
    public List<LoanTransactionDTO> getLoanHistory(String loanId) {
        if (!loanRepository.existsById(loanId)) {
            throw new EntityNotFoundException("Loan", loanId);
        }
        return loanTransactionRepository.findByLoanIdOrderByTickAscIdAsc(loanId)
                .stream().map(LoanTransactionDTO::from).toList();
    }

    // ── Manual repayment ─────────────────────────────────────────────────────
    @Override
    @Transactional
    public LoanDTO payInstallment(String loanId, int currentTick) {
        Loan loan = requirePayableLoan(loanId);
        int payment = Math.min(loan.getTickPayment(), loan.getRemainingBalance());
        applyPayment(loan, requirePlayer(loan.getPlayerId()), payment,
                currentTick, LoanTransactionType.INSTALLMENT, "Instalment paid");
        return toDTO(loan);
    }

    @Override
    @Transactional
    public LoanDTO payOff(String loanId, int currentTick) {
        Loan loan = requirePayableLoan(loanId);
        applyPayment(loan, requirePlayer(loan.getPlayerId()), loan.getRemainingBalance(),
                currentTick, LoanTransactionType.PAYOFF, "Loan paid off in full");
        return toDTO(loan);
    }

    /** Deducts {@code payment} from the player, reduces the balance and logs it — or throws on short cash. */
    private void applyPayment(Loan loan, Player player, int payment,
                              int tick, LoanTransactionType type, String description) {
        if (payment <= 0) {
            loan.setStatus(LoanStatus.PAID_OFF);
            loanRepository.save(loan);
            return;
        }
        if (player.getMoney() < payment) {
            throw new InsufficientFundsException(
                    "Not enough cash to pay € " + payment + " (balance € " + player.getMoney() + ").");
        }
        player.setMoney(player.getMoney() - payment);
        loan.setRemainingBalance(loan.getRemainingBalance() - payment);
        loan.setOverdueTicks(0);
        loan.setStatus(loan.getRemainingBalance() <= 0 ? LoanStatus.PAID_OFF : LoanStatus.ACTIVE);
        playerRepository.save(player);
        loanRepository.save(loan);
        recordTx(loan, tick, type, payment, description);
    }

    // ── Per-tick auto-debit ──────────────────────────────────────────────────
    @Override
    @Transactional
    public void processTickForSession(String sessionId, int currentTick) {
        List<Player> players = playerRepository.findAllBySessionId(sessionId);
        if (players.isEmpty()) return;

        Map<String, Player> byId = players.stream()
                .collect(Collectors.toMap(Player::getId, Function.identity()));
        List<Loan> loans = loanRepository.findByPlayerIdInAndStatusIn(byId.keySet(), PAYABLE);
        if (loans.isEmpty()) return;

        for (Loan loan : loans) {
            Player player = byId.get(loan.getPlayerId());
            if (player == null) continue;

            int payment = Math.min(loan.getTickPayment(), loan.getRemainingBalance());
            if (payment <= 0) { loan.setStatus(LoanStatus.PAID_OFF); continue; }

            if (player.getMoney() >= payment) {
                player.setMoney(player.getMoney() - payment);
                loan.setRemainingBalance(loan.getRemainingBalance() - payment);
                loan.setOverdueTicks(0);
                loan.setStatus(loan.getRemainingBalance() <= 0 ? LoanStatus.PAID_OFF : LoanStatus.ACTIVE);
                recordTx(loan, currentTick, LoanTransactionType.INSTALLMENT, payment, "Auto-debit instalment");
            } else {
                // Can't pay → overdue with penalty interest on the outstanding balance.
                loan.setOverdueTicks(loan.getOverdueTicks() + 1);
                // Penalty compounds each tick, but the balance is capped at
                // penaltyCapMultiple × the original total owed, so a never-paid
                // loan tops out instead of growing without bound.
                int cap = (int) (loan.getTotalRepayable() * penaltyCapMultiple);
                int penalty = Math.max(0, Math.min(
                        (int) Math.ceil(loan.getRemainingBalance() * overduePenaltyRate),
                        cap - loan.getRemainingBalance()));
                if (penalty > 0) {
                    loan.setRemainingBalance(loan.getRemainingBalance() + penalty);
                    recordTx(loan, currentTick, LoanTransactionType.PENALTY, penalty, "Missed payment penalty");
                }
                loan.setStatus(loan.getOverdueTicks() >= maxOverdueTicks
                        ? LoanStatus.DEFAULTED : LoanStatus.OVERDUE);
                if (loan.getStatus() == LoanStatus.DEFAULTED) {
                    log.info("Loan {} of player {} DEFAULTED after {} overdue ticks",
                            loan.getId(), loan.getPlayerId(), loan.getOverdueTicks());
                }
            }
        }

        playerRepository.saveAll(players);
        loanRepository.saveAll(loans);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Builds a LoanDTO enriched with the transaction-derived read aggregates. */
    private LoanDTO toDTO(Loan loan) {
        LoanDTO dto = LoanDTO.from(loan); // originationTick already set from startTick
        int payments = 0;
        long cashPaid = 0;
        for (LoanTransaction t : loanTransactionRepository.findByLoanId(loan.getId())) {
            if (t.getType() == LoanTransactionType.INSTALLMENT
                    || t.getType() == LoanTransactionType.PAYOFF) {
                payments++;
                cashPaid += t.getAmount();
            }
        }
        dto.setPaymentsMadeCount(payments);

        int interest = loan.getTotalRepayable() - loan.getPrincipal();
        int totalInterestPaid = loan.getTotalRepayable() > 0
                ? (int) Math.round(cashPaid * (double) interest / loan.getTotalRepayable())
                : 0;
        dto.setTotalInterestPaid(totalInterestPaid);
        return dto;
    }

    private void recordTx(Loan loan, int tick, LoanTransactionType type, int amount, String description) {
        loanTransactionRepository.save(new LoanTransaction(
                loan.getId(), loan.getPlayerId(), tick, type, amount,
                loan.getRemainingBalance(), description));
    }

    /** True if the player has any loan in arrears (OVERDUE or DEFAULTED) — blocks new borrowing. */
    private boolean hasArrears(String playerId) {
        return !loanRepository.findByPlayerIdInAndStatusIn(
                List.of(playerId), List.of(LoanStatus.OVERDUE, LoanStatus.DEFAULTED)).isEmpty();
    }

    private Player requirePlayer(String playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player", playerId));
    }

    private Loan requirePayableLoan(String loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new EntityNotFoundException("Loan", loanId));
        // Anything not yet fully settled can be paid — DEFAULTED included, so the
        // player can still clear a defaulted debt instead of it being frozen.
        if (!PAYABLE.contains(loan.getStatus())) {
            throw new BusinessRuleViolationException("Loan is already settled (status " + loan.getStatus() + ").");
        }
        return loan;
    }

    /** Snap loose term values to the three offered terms (short/standard/long). */
    private int normalizeTerm(int termTicks) {
        if (termTicks <= 30)  return 30;
        if (termTicks <= 60)  return 60;
        return 120;
    }
}
