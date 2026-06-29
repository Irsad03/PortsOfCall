package at.fhv.player.dto;

public class MortgageQuoteDTO {

    private boolean approved;
    private String  reason;

    private String  shipId;
    private String  shipName;
    private int     shipValue;
    private int     maxMortgage;    // loan-to-value ceiling for this ship

    private int     amount;
    private int     termTicks;
    private double  interestRate;   // fraction, e.g. 0.08
    private int     totalRepayable; // amount + interest
    private int     tickPayment;    // totalRepayable / termTicks (rounded up)
    private String  creditRating;

    public MortgageQuoteDTO() {}

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }

    public int getShipValue() { return shipValue; }
    public void setShipValue(int shipValue) { this.shipValue = shipValue; }

    public int getMaxMortgage() { return maxMortgage; }
    public void setMaxMortgage(int maxMortgage) { this.maxMortgage = maxMortgage; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getTermTicks() { return termTicks; }
    public void setTermTicks(int termTicks) { this.termTicks = termTicks; }

    public double getInterestRate() { return interestRate; }
    public void setInterestRate(double interestRate) { this.interestRate = interestRate; }

    public int getTotalRepayable() { return totalRepayable; }
    public void setTotalRepayable(int totalRepayable) { this.totalRepayable = totalRepayable; }

    public int getTickPayment() { return tickPayment; }
    public void setTickPayment(int tickPayment) { this.tickPayment = tickPayment; }

    public String getCreditRating() { return creditRating; }
    public void setCreditRating(String creditRating) { this.creditRating = creditRating; }
}
