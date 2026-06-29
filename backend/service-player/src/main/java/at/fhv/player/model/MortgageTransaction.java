package at.fhv.player.model;

import jakarta.persistence.*;

@Entity
@Table(name = "mortgage_transactions")
public class MortgageTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "mortgage_id", nullable = false)
    private String mortgageId;

    @Column(name = "player_id", nullable = false)
    private String playerId;

    private int tick;

    @Enumerated(EnumType.STRING)
    private MortgageTransactionType type;

    private int amount;

    private int balanceAfter;

    @Column(length = 200)
    private String description;

    public MortgageTransaction() {}

    public MortgageTransaction(String mortgageId, String playerId, int tick,
                               MortgageTransactionType type, int amount,
                               int balanceAfter, String description) {
        this.mortgageId   = mortgageId;
        this.playerId     = playerId;
        this.tick         = tick;
        this.type         = type;
        this.amount       = amount;
        this.balanceAfter = balanceAfter;
        this.description  = description;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMortgageId() { return mortgageId; }
    public void setMortgageId(String mortgageId) { this.mortgageId = mortgageId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public int getTick() { return tick; }
    public void setTick(int tick) { this.tick = tick; }

    public MortgageTransactionType getType() { return type; }
    public void setType(MortgageTransactionType type) { this.type = type; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
