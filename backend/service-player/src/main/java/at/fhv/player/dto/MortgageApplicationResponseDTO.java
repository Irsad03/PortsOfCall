package at.fhv.player.dto;

/**
 * Response to a successful mortgage application: the created mortgage plus a
 * small repayment preview (per-tick instalment and total interest cost).
 */
public class MortgageApplicationResponseDTO {

    private MortgageDTO mortgage;
    private int         tickPayment;    // per-tick instalment
    private int         totalInterest;  // totalRepayable - principal

    public MortgageApplicationResponseDTO() {}

    public MortgageApplicationResponseDTO(MortgageDTO mortgage, int tickPayment, int totalInterest) {
        this.mortgage      = mortgage;
        this.tickPayment   = tickPayment;
        this.totalInterest = totalInterest;
    }

    public MortgageDTO getMortgage() { return mortgage; }
    public void setMortgage(MortgageDTO mortgage) { this.mortgage = mortgage; }

    public int getTickPayment() { return tickPayment; }
    public void setTickPayment(int tickPayment) { this.tickPayment = tickPayment; }

    public int getTotalInterest() { return totalInterest; }
    public void setTotalInterest(int totalInterest) { this.totalInterest = totalInterest; }
}
