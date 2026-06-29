package at.fhv.player.dto;

public class CreditAssessmentDTO {

    private int    cash;
    private int    totalDebt;
    private int    netWorth;
    private int    creditScore;   // 0–1000
    private String creditRating;  // S+/A/B/C/D/E
    private int    maxLoan;       // credit limit

    public CreditAssessmentDTO() {}

    public CreditAssessmentDTO(int cash, int totalDebt, int netWorth,
                               int creditScore, String creditRating, int maxLoan) {
        this.cash         = cash;
        this.totalDebt    = totalDebt;
        this.netWorth     = netWorth;
        this.creditScore  = creditScore;
        this.creditRating = creditRating;
        this.maxLoan      = maxLoan;
    }

    public int getCash() { return cash; }
    public void setCash(int cash) { this.cash = cash; }

    public int getTotalDebt() { return totalDebt; }
    public void setTotalDebt(int totalDebt) { this.totalDebt = totalDebt; }

    public int getNetWorth() { return netWorth; }
    public void setNetWorth(int netWorth) { this.netWorth = netWorth; }

    public int getCreditScore() { return creditScore; }
    public void setCreditScore(int creditScore) { this.creditScore = creditScore; }

    public String getCreditRating() { return creditRating; }
    public void setCreditRating(String creditRating) { this.creditRating = creditRating; }

    public int getMaxLoan() { return maxLoan; }
    public void setMaxLoan(int maxLoan) { this.maxLoan = maxLoan; }
}
