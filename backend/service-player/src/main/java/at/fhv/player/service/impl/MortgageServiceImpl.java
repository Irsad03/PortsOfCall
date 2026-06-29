package at.fhv.player.service.impl;

import at.fhv.player.client.ShipClient;
import at.fhv.player.dto.CreditAssessmentDTO;
import at.fhv.player.dto.MortgageApplicationResponseDTO;
import at.fhv.player.dto.MortgageDTO;
import at.fhv.player.dto.MortgageOptionDTO;
import at.fhv.player.dto.MortgageQuoteDTO;
import at.fhv.player.dto.MortgageTransactionDTO;
import at.fhv.player.dto.ShipDTO;
import at.fhv.player.exception.BusinessRuleViolationException;
import at.fhv.player.exception.EntityNotFoundException;
import at.fhv.player.exception.InsufficientFundsException;
import at.fhv.player.model.Mortgage;
import at.fhv.player.model.MortgageStatus;
import at.fhv.player.model.MortgageTransaction;
import at.fhv.player.model.MortgageTransactionType;
import at.fhv.player.model.Player;
import at.fhv.player.repository.MortgageRepository;
import at.fhv.player.repository.MortgageTransactionRepository;
import at.fhv.player.repository.PlayerRepository;
import at.fhv.player.service.BankService;
import at.fhv.player.service.MortgageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MortgageServiceImpl implements MortgageService {

    private static final Logger log = LoggerFactory.getLogger(MortgageServiceImpl.class);

    /** Mortgages worth at least this much are worth issuing. */
    private static final int MIN_MORTGAGE = 1_000;

    private static final List<MortgageStatus> PAYABLE = List.of(MortgageStatus.ACTIVE, MortgageStatus.OVERDUE);

    private final PlayerRepository              playerRepository;
    private final MortgageRepository            mortgageRepository;
    private final MortgageTransactionRepository mortgageTransactionRepository;
    private final BankService                   bankService;
    private final ShipClient                    shipClient;

    /** Maximum mortgage as a fraction of the ship's value (loan-to-value ceiling). */
    @Value("${mortgage.max-ltv:0.6}")
    private double maxLtv;

    /** Extra interest added to the balance for each tick a payment is missed. */
    @Value("${mortgage.overdue.penalty-rate:0.05}")
    private double overduePenaltyRate;

    /** Consecutive overdue ticks after which the bank seizes the ship. */
    @Value("${mortgage.overdue.max-ticks:5}")
    private int maxOverdueTicks;

    public MortgageServiceImpl(PlayerRepository playerRepository,
                               MortgageRepository mortgageRepository,
                               MortgageTransactionRepository mortgageTransactionRepository,
                               BankService bankService,
                               ShipClient shipClient) {
        this.playerRepository              = playerRepository;
        this.mortgageRepository            = mortgageRepository;
        this.mortgageTransactionRepository = mortgageTransactionRepository;
        this.bankService                   = bankService;
        this.shipClient                    = shipClient;
    }

    // ── Options ──────────────────────────────────────────────────────────────
    @Override
    public List<MortgageOptionDTO> getMortgageOptions(String playerId) {
        List<MortgageOptionDTO> options = new ArrayList<>();
        for (ShipDTO ship : shipClient.getFleet(playerId)) {
            int value = ship.getPrice();
            int maxMortgage = maxMortgageFor(value);
            boolean alreadyMortgaged = ship.isMortgaged() || hasOpenMortgage(ship.getId());
            boolean seized = "SEIZED".equals(ship.getStatus());

            boolean eligible;
            String reason;
            if (seized) {
                eligible = false;
                reason = "This ship has been repossessed.";
            } else if (alreadyMortgaged) {
                eligible = false;
                reason = "Already mortgaged.";
            } else if (maxMortgage < MIN_MORTGAGE) {
                eligible = false;
                reason = "Too low in value to mortgage.";
            } else {
                eligible = true;
                reason = null;
            }

            options.add(new MortgageOptionDTO(ship.getId(), ship.getName(), ship.getShipClass(),
                    value, maxMortgage, eligible, reason));
        }
        return options;
    }

    // ── Quote ────────────────────────────────────────────────────────────────
    @Override
    public MortgageQuoteDTO quoteMortgage(String playerId, String shipId, int amount, int termTicks) {
        ShipDTO ship = shipClient.getShip(shipId);
        CreditAssessmentDTO credit = bankService.assessCredit(playerId);

        int    value       = ship.getPrice();
        int    maxMortgage = maxMortgageFor(value);
        int    term        = normalizeTerm(termTicks);
        double rate        = bankService.interestRateFor(credit.getCreditRating(), term);

        int totalRepayable = (int) Math.round(amount * (1.0 + rate));
        int tickPayment    = term > 0 ? (int) Math.ceil((double) totalRepayable / term) : totalRepayable;

        MortgageQuoteDTO q = new MortgageQuoteDTO();
        q.setShipId(shipId);
        q.setShipName(ship.getName());
        q.setShipValue(value);
        q.setMaxMortgage(maxMortgage);
        q.setAmount(amount);
        q.setTermTicks(term);
        q.setInterestRate(rate);
        q.setCreditRating(credit.getCreditRating());
        q.setTotalRepayable(totalRepayable);
        q.setTickPayment(tickPayment);

        boolean ownedByPlayer = playerId.equals(ship.getPlayerId());
        boolean alreadyMortgaged = ship.isMortgaged() || hasOpenMortgage(shipId);

        if (!ownedByPlayer) {
            q.setApproved(false);
            q.setReason("That ship isn't yours to mortgage.");
        } else if ("SEIZED".equals(ship.getStatus())) {
            q.setApproved(false);
            q.setReason("This ship has been repossessed and cannot be mortgaged.");
        } else if (alreadyMortgaged) {
            q.setApproved(false);
            q.setReason("This ship already carries a mortgage. Pay it off first.");
        } else if (maxMortgage < MIN_MORTGAGE) {
            q.setApproved(false);
            q.setReason("This ship is worth too little to mortgage.");
        } else if (amount <= 0) {
            q.setApproved(false);
            q.setReason("Please choose an amount greater than zero.");
        } else if (amount > maxMortgage) {
            q.setApproved(false);
            q.setReason("That exceeds " + ltvPercent() + "% of the ship's value (max €" + maxMortgage + ").");
        } else {
            q.setApproved(true);
            q.setReason("Approved.");
        }
        return q;
    }

    // ── Application ──────────────────────────────────────────────────────────
    @Override
    @Transactional
    public MortgageApplicationResponseDTO applyForMortgage(String playerId, String shipId,
                                                           int amount, int termTicks, int currentTick) {
        MortgageQuoteDTO quote = quoteMortgage(playerId, shipId, amount, termTicks);
        if (!quote.isApproved()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, quote.getReason());
        }

        Player player = requirePlayer(playerId);
        player.setMoney(player.getMoney() + amount);
        playerRepository.save(player);

        int term = quote.getTermTicks();
        Mortgage mortgage = new Mortgage(playerId, shipId, quote.getShipName(), quote.getShipValue(),
                amount, quote.getInterestRate(), quote.getTotalRepayable(), quote.getTickPayment(),
                term, currentTick, currentTick + term);
        mortgageRepository.save(mortgage);

        recordTx(mortgage, currentTick, MortgageTransactionType.DISBURSEMENT, amount, "Mortgage disbursed");

        // Mark the collateral so the lien is visible and selling is blocked.
        shipClient.setMortgaged(shipId, true);

        int totalInterest = quote.getTotalRepayable() - amount;
        return new MortgageApplicationResponseDTO(toDTO(mortgage), quote.getTickPayment(), totalInterest);
    }

    // ── Reads ────────────────────────────────────────────────────────────────
    @Override
    public List<MortgageDTO> getMortgages(String playerId, MortgageStatus status) {
        List<Mortgage> mortgages = (status == null)
                ? mortgageRepository.findByPlayerId(playerId)
                : mortgageRepository.findByPlayerIdAndStatus(playerId, status);
        return mortgages.stream().map(this::toDTO).toList();
    }

    @Override
    public List<MortgageTransactionDTO> getMortgageHistory(String mortgageId) {
        if (!mortgageRepository.existsById(mortgageId)) {
            throw new EntityNotFoundException("Mortgage", mortgageId);
        }
        return mortgageTransactionRepository.findByMortgageIdOrderByTickAscIdAsc(mortgageId)
                .stream().map(MortgageTransactionDTO::from).toList();
    }

    // ── Manual repayment ─────────────────────────────────────────────────────
    @Override
    @Transactional
    public MortgageDTO payInstallment(String mortgageId, int currentTick) {
        Mortgage mortgage = requirePayableMortgage(mortgageId);
        int payment = Math.min(mortgage.getTickPayment(), mortgage.getRemainingBalance());
        applyPayment(mortgage, requirePlayer(mortgage.getPlayerId()), payment,
                currentTick, MortgageTransactionType.INSTALLMENT, "Instalment paid");
        return toDTO(mortgage);
    }

    @Override
    @Transactional
    public MortgageDTO payOff(String mortgageId, int currentTick) {
        Mortgage mortgage = requirePayableMortgage(mortgageId);
        applyPayment(mortgage, requirePlayer(mortgage.getPlayerId()), mortgage.getRemainingBalance(),
                currentTick, MortgageTransactionType.PAYOFF, "Mortgage paid off in full");
        return toDTO(mortgage);
    }

    /** Deducts {@code payment}, reduces the balance and logs it — releasing the lien on full repayment. */
    private void applyPayment(Mortgage mortgage, Player player, int payment,
                              int tick, MortgageTransactionType type, String description) {
        if (payment <= 0) {
            releaseAsPaidOff(mortgage);
            return;
        }
        if (player.getMoney() < payment) {
            throw new InsufficientFundsException(
                    "Not enough cash to pay € " + payment + " (balance € " + player.getMoney() + ").");
        }
        player.setMoney(player.getMoney() - payment);
        mortgage.setRemainingBalance(mortgage.getRemainingBalance() - payment);
        mortgage.setOverdueTicks(0);
        playerRepository.save(player);
        recordTx(mortgage, tick, type, payment, description);

        if (mortgage.getRemainingBalance() <= 0) {
            releaseAsPaidOff(mortgage);
        } else {
            mortgage.setStatus(MortgageStatus.ACTIVE);
            mortgageRepository.save(mortgage);
        }
    }

    /** Marks a mortgage PAID_OFF and clears the lien on its ship. */
    private void releaseAsPaidOff(Mortgage mortgage) {
        mortgage.setStatus(MortgageStatus.PAID_OFF);
        mortgageRepository.save(mortgage);
        shipClient.setMortgaged(mortgage.getShipId(), false);
    }

    // ── Per-tick auto-debit ──────────────────────────────────────────────────
    @Override
    @Transactional
    public void processTickForSession(String sessionId, int currentTick) {
        List<Player> players = playerRepository.findAllBySessionId(sessionId);
        if (players.isEmpty()) return;

        Map<String, Player> byId = players.stream()
                .collect(Collectors.toMap(Player::getId, Function.identity()));
        List<Mortgage> mortgages = mortgageRepository.findByPlayerIdInAndStatusIn(byId.keySet(), PAYABLE);
        if (mortgages.isEmpty()) return;

        List<String> seizedShipIds = new ArrayList<>();

        for (Mortgage mortgage : mortgages) {
            Player player = byId.get(mortgage.getPlayerId());
            if (player == null) continue;

            int payment = Math.min(mortgage.getTickPayment(), mortgage.getRemainingBalance());
            if (payment <= 0) { releaseAsPaidOff(mortgage); continue; }

            if (player.getMoney() >= payment) {
                player.setMoney(player.getMoney() - payment);
                mortgage.setRemainingBalance(mortgage.getRemainingBalance() - payment);
                mortgage.setOverdueTicks(0);
                recordTx(mortgage, currentTick, MortgageTransactionType.INSTALLMENT, payment, "Auto-debit instalment");
                if (mortgage.getRemainingBalance() <= 0) {
                    releaseAsPaidOff(mortgage);
                } else {
                    mortgage.setStatus(MortgageStatus.ACTIVE);
                }
            } else {
                // Can't pay → overdue with penalty interest on the outstanding balance.
                mortgage.setOverdueTicks(mortgage.getOverdueTicks() + 1);
                int penalty = (int) Math.ceil(mortgage.getRemainingBalance() * overduePenaltyRate);
                mortgage.setRemainingBalance(mortgage.getRemainingBalance() + penalty);
                recordTx(mortgage, currentTick, MortgageTransactionType.PENALTY, penalty, "Missed payment penalty");

                if (mortgage.getOverdueTicks() >= maxOverdueTicks) {
                    // Bank seizes the ship and writes off the remaining balance.
                    int writtenOff = mortgage.getRemainingBalance();
                    recordTx(mortgage, currentTick, MortgageTransactionType.SEIZURE, writtenOff,
                            "Ship repossessed — balance written off");
                    mortgage.setRemainingBalance(0);
                    mortgage.setStatus(MortgageStatus.SEIZED);
                    seizedShipIds.add(mortgage.getShipId());
                    log.info("Mortgage {} of player {} SEIZED after {} overdue ticks",
                            mortgage.getId(), mortgage.getPlayerId(), mortgage.getOverdueTicks());
                } else {
                    mortgage.setStatus(MortgageStatus.OVERDUE);
                }
            }
        }

        playerRepository.saveAll(players);
        mortgageRepository.saveAll(mortgages);

        // Repossess collateral after the DB is consistent (best-effort cross-service call).
        for (String shipId : seizedShipIds) {
            shipClient.seizeShip(shipId);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Loan-to-value ceiling, rounded down to the nearest € 100. */
    private int maxMortgageFor(int shipValue) {
        int max = (int) Math.floor(shipValue * maxLtv);
        return (max / 100) * 100;
    }

    private int ltvPercent() {
        return (int) Math.round(maxLtv * 100);
    }

    private boolean hasOpenMortgage(String shipId) {
        return !mortgageRepository.findByShipIdAndStatusIn(shipId, PAYABLE).isEmpty();
    }

    /** Builds a MortgageDTO enriched with the transaction-derived read aggregates. */
    private MortgageDTO toDTO(Mortgage mortgage) {
        MortgageDTO dto = MortgageDTO.from(mortgage);
        int payments = 0;
        long cashPaid = 0;
        for (MortgageTransaction t : mortgageTransactionRepository.findByMortgageId(mortgage.getId())) {
            if (t.getType() == MortgageTransactionType.INSTALLMENT
                    || t.getType() == MortgageTransactionType.PAYOFF) {
                payments++;
                cashPaid += t.getAmount();
            }
        }
        dto.setPaymentsMadeCount(payments);

        int interest = mortgage.getTotalRepayable() - mortgage.getPrincipal();
        int totalInterestPaid = mortgage.getTotalRepayable() > 0
                ? (int) Math.round(cashPaid * (double) interest / mortgage.getTotalRepayable())
                : 0;
        dto.setTotalInterestPaid(totalInterestPaid);
        return dto;
    }

    private void recordTx(Mortgage mortgage, int tick, MortgageTransactionType type, int amount, String description) {
        mortgageTransactionRepository.save(new MortgageTransaction(
                mortgage.getId(), mortgage.getPlayerId(), tick, type, amount,
                mortgage.getRemainingBalance(), description));
    }

    private Player requirePlayer(String playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player", playerId));
    }

    private Mortgage requirePayableMortgage(String mortgageId) {
        Mortgage mortgage = mortgageRepository.findById(mortgageId)
                .orElseThrow(() -> new EntityNotFoundException("Mortgage", mortgageId));
        if (mortgage.getStatus() != MortgageStatus.ACTIVE && mortgage.getStatus() != MortgageStatus.OVERDUE) {
            throw new BusinessRuleViolationException("Mortgage is not active (status " + mortgage.getStatus() + ").");
        }
        return mortgage;
    }

    /** Snap loose term values to the three offered terms (short/standard/long). */
    private int normalizeTerm(int termTicks) {
        if (termTicks <= 30)  return 30;
        if (termTicks <= 60)  return 60;
        return 120;
    }
}
