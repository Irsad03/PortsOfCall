package at.fhv.freight.dto;


public class WaypointUpdateDTO {
    private String shipId;
    private String playerId;
    private int x;
    private int y;

    public WaypointUpdateDTO() {}

    public WaypointUpdateDTO(String shipId, String playerId, int x, int y) {
        this.shipId = shipId;
        this.playerId = playerId;
        this.x = x;
        this.y = y;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public int getX() { return x; }
    public void setX(int x) { this.x = x; }

    public int getY() { return y; }
    public void setY(int y) { this.y = y; }
}
