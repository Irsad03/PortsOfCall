package at.fhv.freight.dto;

public class SellShipRequestDTO {
    private String playerId;

    public SellShipRequestDTO() {}

    public SellShipRequestDTO(String playerId) {
        this.playerId = playerId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }
}
