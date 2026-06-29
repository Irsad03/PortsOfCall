package at.fhv.player.dto;

public class LoanQuoteDTO {

    private boolean approved;
    private String  reason;

    private int     amount;
    private int     termTicks;
    private double  interestRate;   // fraction, e.g. 0.08
    private int     totalRepayable; // amount + interest
    private int     tickPayment;    // totalRepayable / termTicks (rounded up)
    private int     maxLoan;        // credit limit for this player
    private String  creditRating;

    public LoanQuoteDTO() {}

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

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

    public int getMaxLoan() { return maxLoan; }
    public void setMaxLoan(int maxLoan) { this.maxLoan = maxLoan; }

    public String getCreditRating() { return creditRating; }
    public void setCreditRating(String creditRating) { this.creditRating = creditRating; }
}
