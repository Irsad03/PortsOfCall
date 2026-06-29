package at.fhv.freight.dto;

public class ShipArrivalDTO {
    private String shipId;
    private String playerId;
    private String arrivedPortId;
    private int arrivedX;
    private int arrivedY;

    public ShipArrivalDTO() {}

    public ShipArrivalDTO(String shipId, String playerId, String arrivedPortId,
                          int arrivedX, int arrivedY) {
        this.shipId = shipId;
        this.playerId = playerId;
        this.arrivedPortId = arrivedPortId;
        this.arrivedX = arrivedX;
        this.arrivedY = arrivedY;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getArrivedPortId() { return arrivedPortId; }
    public void setArrivedPortId(String arrivedPortId) { this.arrivedPortId = arrivedPortId; }

    public int getArrivedX() { return arrivedX; }
    public void setArrivedX(int arrivedX) { this.arrivedX = arrivedX; }

    public int getArrivedY() { return arrivedY; }
    public void setArrivedY(int arrivedY) { this.arrivedY = arrivedY; }
}
