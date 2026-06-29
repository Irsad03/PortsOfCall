package at.fhv.player.model;

import jakarta.persistence.*;

@Entity
@Table(name = "loan_transactions")
public class LoanTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "loan_id", nullable = false)
    private String loanId;

    @Column(name = "player_id", nullable = false)
    private String playerId;

    private int tick;

    @Enumerated(EnumType.STRING)
    private LoanTransactionType type;

    private int amount;

    private int balanceAfter;

    @Column(length = 200)
    private String description;

    public LoanTransaction() {}

    public LoanTransaction(String loanId, String playerId, int tick,
                           LoanTransactionType type, int amount,
                           int balanceAfter, String description) {
        this.loanId       = loanId;
        this.playerId     = playerId;
        this.tick         = tick;
        this.type         = type;
        this.amount       = amount;
        this.balanceAfter = balanceAfter;
        this.description  = description;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public int getTick() { return tick; }
    public void setTick(int tick) { this.tick = tick; }

    public LoanTransactionType getType() { return type; }
    public void setType(LoanTransactionType type) { this.type = type; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
