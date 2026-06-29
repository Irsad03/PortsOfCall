package at.fhv.engine.dto;

public class PlayerStateDTO {
    private String playerId;
    private String name;
    private int money;
    private int netWorth;
    private int x;
    private int y;
    private ShipStatus shipStatus;
    private String currentPortId;
    private CurrentShipDTO currentShip;

    public PlayerStateDTO() {}

    public PlayerStateDTO(String playerId, String name, int money, int x, int y,
                          ShipStatus shipStatus, String currentPortId, CurrentShipDTO currentShip) {
        this.playerId = playerId;
        this.name = name;
        this.money = money;
        this.x = x;
        this.y = y;
        this.shipStatus = shipStatus;
        this.currentPortId = currentPortId;
        this.currentShip = currentShip;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getMoney() { return money; }
    public void setMoney(int money) { this.money = money; }

    public int getNetWorth() { return netWorth; }
    public void setNetWorth(int netWorth) { this.netWorth = netWorth; }

    public int getX() { return x; }
    public void setX(int x) { this.x = x; }

    public int getY() { return y; }
    public void setY(int y) { this.y = y; }

    public ShipStatus getShipStatus() { return shipStatus; }
    public void setShipStatus(ShipStatus shipStatus) { this.shipStatus = shipStatus; }

    public String getCurrentPortId() { return currentPortId; }
    public void setCurrentPortId(String currentPortId) { this.currentPortId = currentPortId; }

    public CurrentShipDTO getCurrentShip() { return currentShip; }
    public void setCurrentShip(CurrentShipDTO currentShip) { this.currentShip = currentShip; }
}