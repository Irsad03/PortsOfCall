package at.fhv.player.model;

import jakarta.persistence.*;

@Entity
@Table(name = "mortgages")
public class Mortgage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "player_id", nullable = false)
    private String playerId;

    @Column(name = "ship_id", nullable = false)
    private String shipId;

    @Column(name = "ship_name")
    private String shipName;

    @Column(name = "ship_value")
    private int shipValue;

    private int principal;

    private double interestRate;

    private int totalRepayable;

    private int remainingBalance;

    private int tickPayment;

    private int termTicks;

    private int startTick;

    private int dueTick;

    private int overdueTicks;

    @Enumerated(EnumType.STRING)
    private MortgageStatus status = MortgageStatus.ACTIVE;

    public Mortgage() {}

    public Mortgage(String playerId, String shipId, String shipName, int shipValue,
                    int principal, double interestRate, int totalRepayable,
                    int tickPayment, int termTicks, int startTick, int dueTick) {
        this.playerId         = playerId;
        this.shipId           = shipId;
        this.shipName         = shipName;
        this.shipValue        = shipValue;
        this.principal        = principal;
        this.interestRate     = interestRate;
        this.totalRepayable   = totalRepayable;
        this.remainingBalance = totalRepayable;
        this.tickPayment      = tickPayment;
        this.termTicks        = termTicks;
        this.startTick        = startTick;
        this.dueTick          = dueTick;
        this.overdueTicks     = 0;
        this.status           = MortgageStatus.ACTIVE;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }

    public int getShipValue() { return shipValue; }
    public void setShipValue(int shipValue) { this.shipValue = shipValue; }

    public int getPrincipal() { return principal; }
    public void setPrincipal(int principal) { this.principal = principal; }

    public double getInterestRate() { return interestRate; }
    public void setInterestRate(double interestRate) { this.interestRate = interestRate; }

    public int getTotalRepayable() { return totalRepayable; }
    public void setTotalRepayable(int totalRepayable) { this.totalRepayable = totalRepayable; }

    public int getRemainingBalance() { return remainingBalance; }
    public void setRemainingBalance(int remainingBalance) { this.remainingBalance = remainingBalance; }

    public int getTickPayment() { return tickPayment; }
    public void setTickPayment(int tickPayment) { this.tickPayment = tickPayment; }

    public int getTermTicks() { return termTicks; }
    public void setTermTicks(int termTicks) { this.termTicks = termTicks; }

    public int getStartTick() { return startTick; }
    public void setStartTick(int startTick) { this.startTick = startTick; }

    public int getDueTick() { return dueTick; }
    public void setDueTick(int dueTick) { this.dueTick = dueTick; }

    public int getOverdueTicks() { return overdueTicks; }
    public void setOverdueTicks(int overdueTicks) { this.overdueTicks = overdueTicks; }

    public MortgageStatus getStatus() { return status; }
    public void setStatus(MortgageStatus status) { this.status = status; }
}
