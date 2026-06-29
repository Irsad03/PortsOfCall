package at.fhv.player.dto;

import at.fhv.player.model.Loan;

public class LoanDTO {

    private String id;
    private String playerId;
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

    public LoanDTO() {}

    public static LoanDTO from(Loan loan) {
        LoanDTO dto = new LoanDTO();
        dto.id               = loan.getId();
        dto.playerId         = loan.getPlayerId();
        dto.principal        = loan.getPrincipal();
        dto.interestRate     = loan.getInterestRate();
        dto.totalRepayable   = loan.getTotalRepayable();
        dto.remainingBalance = loan.getRemainingBalance();
        dto.tickPayment      = loan.getTickPayment();
        dto.termTicks        = loan.getTermTicks();
        dto.startTick        = loan.getStartTick();
        dto.dueTick          = loan.getDueTick();
        dto.overdueTicks     = loan.getOverdueTicks();
        dto.status           = loan.getStatus().name();
        dto.originationTick  = loan.getStartTick();
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

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
