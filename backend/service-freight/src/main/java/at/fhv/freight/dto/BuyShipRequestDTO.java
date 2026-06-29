package at.fhv.freight.dto;

public class BuyShipRequestDTO {
    private String playerId;
    private String shipId;
    private String shipName;

    public BuyShipRequestDTO() {}

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }
}
