package at.fhv.player.dto;

public class BankOverviewDTO {

    private int cash;
    private int netWorth;
    private int totalDebt;
    private String creditRating;
    private int creditScore;

    public BankOverviewDTO() {}

    public BankOverviewDTO(int cash, int netWorth, int totalDebt, String creditRating, int creditScore) {
        this.cash         = cash;
        this.netWorth     = netWorth;
        this.totalDebt    = totalDebt;
        this.creditRating = creditRating;
        this.creditScore  = creditScore;
    }

    public int getCash()              { return cash; }
    public void setCash(int cash)     { this.cash = cash; }

    public int getNetWorth()                  { return netWorth; }
    public void setNetWorth(int netWorth)     { this.netWorth = netWorth; }

    public int getTotalDebt()                 { return totalDebt; }
    public void setTotalDebt(int totalDebt)   { this.totalDebt = totalDebt; }

    public String getCreditRating()                     { return creditRating; }
    public void setCreditRating(String creditRating)    { this.creditRating = creditRating; }

    public int getCreditScore()                 { return creditScore; }
    public void setCreditScore(int creditScore) { this.creditScore = creditScore; }
}
