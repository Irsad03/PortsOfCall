package at.fhv.navigation.port.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ports")
public class Port {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    private int x;
    private int y;

    @Column(name = "pilot_strike_until_tick")
    private Integer pilotStrikeUntilTick;

    @Column(name = "pilot_strike_group")
    private String pilotStrikeGroup;

    @Column(name = "pilot_strike_headline")
    private String pilotStrikeHeadline;

    public Port() {}

    public Port(String name, int x, int y) {
        this.name = name;
        this.x = x;
        this.y = y;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getX() { return x; }
    public void setX(int x) { this.x = x; }

    public int getY() { return y; }
    public void setY(int y) { this.y = y; }

    public Integer getPilotStrikeUntilTick() { return pilotStrikeUntilTick; }
    public void setPilotStrikeUntilTick(Integer pilotStrikeUntilTick) {
        this.pilotStrikeUntilTick = pilotStrikeUntilTick;
    }

    public String getPilotStrikeGroup() { return pilotStrikeGroup; }
    public void setPilotStrikeGroup(String pilotStrikeGroup) {
        this.pilotStrikeGroup = pilotStrikeGroup;
    }

    public String getPilotStrikeHeadline() { return pilotStrikeHeadline; }
    public void setPilotStrikeHeadline(String pilotStrikeHeadline) {
        this.pilotStrikeHeadline = pilotStrikeHeadline;
    }
}