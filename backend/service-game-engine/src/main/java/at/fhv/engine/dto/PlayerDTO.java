package at.fhv.engine.dto;

public class PlayerDTO {
    private String id;
    private String name;
    private int money;
    private String sessionId;
    private int positionX;
    private int positionY;
    private String homePortId;
    private String currentPortId;
    private String currentShipId;
    private int netWorth;

    public PlayerDTO() {}

    public PlayerDTO(String id, String name, int money, String sessionId,
                     int positionX, int positionY,
                     String homePortId, String currentPortId, String currentShipId) {
        this.id = id;
        this.name = name;
        this.money = money;
        this.sessionId = sessionId;
        this.positionX = positionX;
        this.positionY = positionY;
        this.homePortId = homePortId;
        this.currentPortId = currentPortId;
        this.currentShipId = currentShipId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getMoney() { return money; }
    public void setMoney(int money) { this.money = money; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public int getPositionX() { return positionX; }
    public void setPositionX(int positionX) { this.positionX = positionX; }

    public int getPositionY() { return positionY; }
    public void setPositionY(int positionY) { this.positionY = positionY; }

    public String getHomePortId() { return homePortId; }
    public void setHomePortId(String homePortId) { this.homePortId = homePortId; }

    public String getCurrentPortId() { return currentPortId; }
    public void setCurrentPortId(String currentPortId) { this.currentPortId = currentPortId; }

    public String getCurrentShipId() { return currentShipId; }
    public void setCurrentShipId(String currentShipId) { this.currentShipId = currentShipId; }

    public int getNetWorth() { return netWorth; }
    public void setNetWorth(int netWorth) { this.netWorth = netWorth; }
}