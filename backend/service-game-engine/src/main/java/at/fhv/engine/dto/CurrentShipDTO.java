package at.fhv.engine.dto;

import java.util.List;

public class CurrentShipDTO {
    private String id;
    private String name;
    private ShipClass shipClass;
    private int capacity;
    private ShipStatus status;
    private String activeRouteId;
    private int currentWaypointIndex;
    private List<WaypointDTO> activeRouteWaypoints;
    private Integer lastVoyageProfit;
    private int fuelLevel;
    private int fuelConsumptionPerTick;
    private boolean hasPilot;
    private int healthPoints;

    public CurrentShipDTO() {}

    public CurrentShipDTO(String id, String name, ShipClass shipClass, int capacity, ShipStatus status,
                          String activeRouteId, int currentWaypointIndex,
                          List<WaypointDTO> activeRouteWaypoints, Integer lastVoyageProfit,
                          int fuelLevel, int fuelConsumptionPerTick, boolean hasPilot, int healthPoints) {
        this.id = id;
        this.name = name;
        this.shipClass = shipClass;
        this.capacity = capacity;
        this.status = status;
        this.activeRouteId = activeRouteId;
        this.currentWaypointIndex = currentWaypointIndex;
        this.activeRouteWaypoints = activeRouteWaypoints;
        this.lastVoyageProfit = lastVoyageProfit;
        this.fuelLevel = fuelLevel;
        this.fuelConsumptionPerTick = fuelConsumptionPerTick;
        this.hasPilot = hasPilot;
        this.healthPoints = healthPoints;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ShipClass getShipClass() { return shipClass; }
    public void setShipClass(ShipClass shipClass) { this.shipClass = shipClass; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public ShipStatus getStatus() { return status; }
    public void setStatus(ShipStatus status) { this.status = status; }

    public String getActiveRouteId() { return activeRouteId; }
    public void setActiveRouteId(String activeRouteId) { this.activeRouteId = activeRouteId; }

    public int getCurrentWaypointIndex() { return currentWaypointIndex; }
    public void setCurrentWaypointIndex(int currentWaypointIndex) { this.currentWaypointIndex = currentWaypointIndex; }

    public List<WaypointDTO> getActiveRouteWaypoints() { return activeRouteWaypoints; }
    public void setActiveRouteWaypoints(List<WaypointDTO> activeRouteWaypoints) { this.activeRouteWaypoints = activeRouteWaypoints; }

    public Integer getLastVoyageProfit() { return lastVoyageProfit; }
    public void setLastVoyageProfit(Integer lastVoyageProfit) { this.lastVoyageProfit = lastVoyageProfit; }

    public int getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(int fuelLevel) { this.fuelLevel = fuelLevel; }

    public int getFuelConsumptionPerTick() { return fuelConsumptionPerTick; }
    public void setFuelConsumptionPerTick(int fuelConsumptionPerTick) { this.fuelConsumptionPerTick = fuelConsumptionPerTick; }

    public boolean isHasPilot() { return hasPilot; }
    public void setHasPilot(boolean hasPilot) { this.hasPilot = hasPilot; }

    public int getHealthPoints() { return healthPoints; }
    public void setHealthPoints(int healthPoints) { this.healthPoints = healthPoints; }
}