package at.fhv.freight.dto;

public class StartRouteRequestDTO {
    private String playerId;
    private String shipId;
    private String destinationPortId;

    public StartRouteRequestDTO() {}

    public StartRouteRequestDTO(String playerId, String shipId, String destinationPortId) {
        this.playerId = playerId;
        this.shipId = shipId;
        this.destinationPortId = destinationPortId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }
}
