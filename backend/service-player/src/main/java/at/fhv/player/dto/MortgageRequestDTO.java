package at.fhv.player.dto;

public class MortgageRequestDTO {

    private String shipId;
    private int    amount;
    private int    termTicks;

    public MortgageRequestDTO() {}

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getTermTicks() { return termTicks; }
    public void setTermTicks(int termTicks) { this.termTicks = termTicks; }
}
