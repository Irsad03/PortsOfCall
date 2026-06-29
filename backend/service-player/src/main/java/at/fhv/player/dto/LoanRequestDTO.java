package at.fhv.player.dto;

public class LoanRequestDTO {

    private int amount;
    private int termTicks;

    public LoanRequestDTO() {}

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getTermTicks() { return termTicks; }
    public void setTermTicks(int termTicks) { this.termTicks = termTicks; }
}
