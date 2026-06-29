package at.fhv.freight.dto;

public class BribeRequestDTO {
    private String playerId;
    private int amount;

    public BribeRequestDTO() {}

    public BribeRequestDTO(String playerId, int amount) {
        this.playerId = playerId;
        this.amount = amount;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
}
