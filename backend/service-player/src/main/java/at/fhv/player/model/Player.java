package at.fhv.player.model;

import jakarta.persistence.*;

@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int money = 40000;

    // Session affiliation – stored as a plain ID, no FK across services
    @Column(name = "session_id")
    private String sessionId;

    private int positionX = 0;
    private int positionY = 0;

    @Column(name = "home_port_id")
    private String homePortId;

    @Column(name = "current_port_id")
    private String currentPortId;

    @Column(name = "current_ship_id")
    private String currentShipId;

    public Player() {}

    public Player(String name, String sessionId, int money) {
        this.name = name;
        this.sessionId = sessionId;
        this.money = money;
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
}
