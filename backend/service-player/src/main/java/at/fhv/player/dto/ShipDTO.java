package at.fhv.player.dto;

public class ShipDTO {

    private String id;
    private String playerId;
    private String name;
    private String shipClass;
    private int price;
    private boolean mortgaged;
    private String status;

    public ShipDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getShipClass() { return shipClass; }
    public void setShipClass(String shipClass) { this.shipClass = shipClass; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public boolean isMortgaged() { return mortgaged; }
    public void setMortgaged(boolean mortgaged) { this.mortgaged = mortgaged; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
