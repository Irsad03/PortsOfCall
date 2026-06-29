package at.fhv.freight.dto;

public class ShipActionRequestDTO {
    private String playerId;
    private String shipId;

    public ShipActionRequestDTO() {}

    public ShipActionRequestDTO(String playerId, String shipId) {
        this.playerId = playerId;
        this.shipId = shipId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }
}
