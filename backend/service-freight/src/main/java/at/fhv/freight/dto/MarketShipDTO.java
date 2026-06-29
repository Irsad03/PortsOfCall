package at.fhv.freight.dto;

public class MarketShipDTO {
    private String id;
    private String name;
    private ShipClass shipClass;
    private int price;
    private String description;
    private int capacity;
    private int healthPoints;
    private boolean isUsed;

    private double speed;
    private int fuelPer100;

    public MarketShipDTO() {}

    public MarketShipDTO(String id, String name, ShipClass shipClass, int price,
                         String description, int capacity, int healthPoints, boolean isUsed) {
        this.id = id;
        this.name = name;
        this.shipClass = shipClass;
        this.price = price;
        this.description = description;
        this.capacity = capacity;
        this.healthPoints = healthPoints;
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

    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { isUsed = used; }

    public double getSpeed() { return speed; }
    public void setSpeed(double speed) { this.speed = speed; }

    public int getFuelPer100() { return fuelPer100; }
    public void setFuelPer100(int fuelPer100) { this.fuelPer100 = fuelPer100; }
}