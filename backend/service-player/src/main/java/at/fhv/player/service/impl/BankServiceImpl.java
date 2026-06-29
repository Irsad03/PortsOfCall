package at.fhv.player.service.impl;

import at.fhv.player.dto.BankOverviewDTO;
import at.fhv.player.dto.CreditAssessmentDTO;
import at.fhv.player.model.Loan;
import at.fhv.player.model.LoanStatus;
import at.fhv.player.model.Player;
import at.fhv.player.repository.LoanRepository;
import at.fhv.player.repository.PlayerRepository;
import at.fhv.player.service.BankService;
import at.fhv.player.service.PlayerNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BankServiceImpl implements BankService {

    /** Loans of at least € 1 000 are worth issuing. */
    public static final int MIN_LOAN = 1_000;

    private final PlayerRepository playerRepository;
    private final LoanRepository   loanRepository;

    public BankServiceImpl(PlayerRepository playerRepository, LoanRepository loanRepository) {
        this.playerRepository = playerRepository;
        this.loanRepository   = loanRepository;
    }

    @Override
    public BankOverviewDTO getOverview(String playerId) {
        CreditAssessmentDTO a = assessCredit(playerId);
        return new BankOverviewDTO(a.getCash(), a.getNetWorth(), a.getTotalDebt(),
                a.getCreditRating(), a.getCreditScore());
    }

    @Override
    public CreditAssessmentDTO assessCredit(String playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new PlayerNotFoundException("Player not found: " + playerId));

        int cash      = player.getMoney();
        int totalDebt = activeDebt(playerId);
        int netWorth  = cash - totalDebt;

        int    creditScore  = calculateCreditScore(cash, totalDebt);
        String creditRating = toCreditRating(creditScore);
        int    maxLoan      = maxLoanFor(creditScore, cash, totalDebt);

        return new CreditAssessmentDTO(cash, totalDebt, netWorth, creditScore, creditRating, maxLoan);
    }

    @Override
    public double interestRateFor(String rating, int termTicks) {
        double base = switch (rating) {
            case "S+" -> 0.03;
            case "A"  -> 0.05;
            case "B"  -> 0.08;
            case "C"  -> 0.12;
            case "D"  -> 0.18;
            default   -> 0.25;
        };
        // ±2 % per 60 ticks relative to the 60-tick "standard" term:
        // short term (30) gets a discount, long term (120) a surcharge.
        double termAdjust = (termTicks / 60.0 - 1.0) * 0.02;
        return Math.max(0.02, base + termAdjust);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private int activeDebt(String playerId) {
        // DEFAULTED counts too — a defaulted loan must keep weighing on the
        // player's debt, credit score and net worth (no "escape by defaulting").
        return loanRepository
                .findByPlayerIdInAndStatusIn(List.of(playerId),
                        List.of(LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.DEFAULTED))
                .stream()
                .mapToInt(Loan::getRemainingBalance)
                .sum();
    }

    /** Credit limit: scales with credit score and the player's net worth. */
    private int maxLoanFor(int creditScore, int cash, int totalDebt) {
        // Base the limit on EQUITY (net worth = cash − debt), NOT gross cash.
        // Freshly borrowed money is cash AND debt, so it nets out here — otherwise
        // each loan would inflate the very number that caps borrowing and the limit
        // would spiral upward. The +50k base still lets a near-broke player borrow a
        // starter amount.
        int equity = Math.max(0, cash - totalDebt);
        double headroom = (equity * 2.0 + 50_000) * (creditScore / 1000.0);
        int max = (int) Math.round(headroom);
        if (max <= 0) return 0;
        return (max / 1_000) * 1_000; // round down to nearest € 1 000
    }

    // ── Credit score: 0–1000 ────────────────────────────────────────────────
    private int calculateCreditScore(int cash, int totalDebt) {
        int base;
        if      (cash >= 200_000) base = 900;
        else if (cash >= 100_000) base = 800;
        else if (cash >=  50_000) base = 700;
        else if (cash >=  20_000) base = 550;
        else if (cash >=   5_000) base = 380;
        else if (cash >=       0) base = 220;
        else                      base = Math.max(0, 220 + cash / 500);

        int debtPenalty = (totalDebt / 50_000) * 100;

        return Math.max(0, Math.min(1000, base - debtPenalty));
    }

    // ── Rating label ────────────────────────────────────────────────────────
    private String toCreditRating(int score) {
        if (score >= 850) return "S+";
        if (score >= 700) return "A";
        if (score >= 500) return "B";
        if (score >= 300) return "C";
        if (score >= 150) return "D";
        return "E";
    }
}
