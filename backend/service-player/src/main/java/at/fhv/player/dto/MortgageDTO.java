package at.fhv.player.dto;

import at.fhv.player.model.Mortgage;

public class MortgageDTO {

    private String id;
    private String playerId;
    private String shipId;
    private String shipName;
    private int    shipValue;
    private int    principal;
    private double interestRate;
    private int    totalRepayable;
    private int    remainingBalance;
    private int    tickPayment;
    private int    termTicks;
    private int    startTick;
    private int    dueTick;
    private int    overdueTicks;
    private String status;

    // Read-aggregates (populated by the service from the transaction log).
    private int    originationTick;
    private int    paymentsMadeCount;
    private int    totalInterestPaid;

    public MortgageDTO() {}

    public static MortgageDTO from(Mortgage m) {
        MortgageDTO dto = new MortgageDTO();
        dto.id               = m.getId();
        dto.playerId         = m.getPlayerId();
        dto.shipId           = m.getShipId();
        dto.shipName         = m.getShipName();
        dto.shipValue        = m.getShipValue();
        dto.principal        = m.getPrincipal();
        dto.interestRate     = m.getInterestRate();
        dto.totalRepayable   = m.getTotalRepayable();
        dto.remainingBalance = m.getRemainingBalance();
        dto.tickPayment      = m.getTickPayment();
        dto.termTicks        = m.getTermTicks();
        dto.startTick        = m.getStartTick();
        dto.dueTick          = m.getDueTick();
        dto.overdueTicks     = m.getOverdueTicks();
        dto.status           = m.getStatus().name();
        dto.originationTick  = m.getStartTick();
        return dto;
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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getOriginationTick() { return originationTick; }
    public void setOriginationTick(int originationTick) { this.originationTick = originationTick; }

    public int getPaymentsMadeCount() { return paymentsMadeCount; }
    public void setPaymentsMadeCount(int paymentsMadeCount) { this.paymentsMadeCount = paymentsMadeCount; }

    public int getTotalInterestPaid() { return totalInterestPaid; }
    public void setTotalInterestPaid(int totalInterestPaid) { this.totalInterestPaid = totalInterestPaid; }
}
