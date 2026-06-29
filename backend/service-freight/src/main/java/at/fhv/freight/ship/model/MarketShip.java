package at.fhv.freight.ship.model;

import at.fhv.freight.dto.ShipClass;
import jakarta.persistence.*;

@Entity
@Table(name = "market_ships")
public class MarketShip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipClass shipClass;

    @Column(nullable = false)
    private int price;

    private String description;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private int healthPoints = 100;

    @Column(nullable = false)
    private int fuelConsumptionPerTick = 5;

    @Column(nullable = false)
    private boolean isUsed = false;

    public MarketShip() {}

    public MarketShip(String name, ShipClass shipClass, int price, String description,
                      int capacity, int healthPoints, int fuelConsumptionPerTick, boolean isUsed) {
        this.name = name;
        this.shipClass = shipClass;
        this.price = price;
        this.description = description;
        this.capacity = capacity;
        this.healthPoints = healthPoints;
        this.fuelConsumptionPerTick = fuelConsumptionPerTick;
        this.isUsed = isUsed;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ShipClass getShipClass() { return shipClass; }
    public void setShipClass(ShipClass shipClass) { this.shipClass = shipClass; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getHealthPoints() { return healthPoints; }
    public void setHealthPoints(int healthPoints) { this.healthPoints = healthPoints; }

    public int getFuelConsumptionPerTick() { return fuelConsumptionPerTick; }
    public void setFuelConsumptionPerTick(int fuelConsumptionPerTick) { this.fuelConsumptionPerTick = fuelConsumptionPerTick; }

    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { isUsed = used; }
}
