package at.fhv.freight.dto;

public class CreateShipRequestDTO {
    private String name;
    private ShipClass shipClass;
    private int price;
    private String description;
    private int capacity;
    private Integer healthPoints;
    private Boolean isUsed;

    public CreateShipRequestDTO() {}

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

    public Integer getHealthPoints() { return healthPoints; }
    public void setHealthPoints(Integer healthPoints) { this.healthPoints = healthPoints; }

    public Boolean getIsUsed() { return isUsed; }
    public void setIsUsed(Boolean isUsed) { this.isUsed = isUsed; }
}
