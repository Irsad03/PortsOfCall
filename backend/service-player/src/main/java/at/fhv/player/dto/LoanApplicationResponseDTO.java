package at.fhv.player.dto;

public class LoanApplicationResponseDTO {

    private LoanDTO loan;
    private int     monthlyPayment; // per-tick instalment
    private int     totalInterest;  // totalRepayable - principal

    public LoanApplicationResponseDTO() {}

    public LoanApplicationResponseDTO(LoanDTO loan, int monthlyPayment, int totalInterest) {
        this.loan           = loan;
        this.monthlyPayment = monthlyPayment;
        this.totalInterest  = totalInterest;
    }

    public LoanDTO getLoan() { return loan; }
    public void setLoan(LoanDTO loan) { this.loan = loan; }

    public int getMonthlyPayment() { return monthlyPayment; }
    public void setMonthlyPayment(int monthlyPayment) { this.monthlyPayment = monthlyPayment; }

    public int getTotalInterest() { return totalInterest; }
    public void setTotalInterest(int totalInterest) { this.totalInterest = totalInterest; }
}
