package at.fhv.session.dto;

import java.util.List;

public class FleetShipDTO {
    private String id;
    private String playerId;
    private String name;
    private ShipClass shipClass;
    private int capacity;
    private ShipStatus status;
    private String currentPortId;
    private boolean hasPilot;
    private int fuelLevel;
    private int healthPoints;
    private int maxHealthPoints;
    private int healthPercentage;
    private int fuelConsumptionPerTick;
    private String destinationPortId;
    private String activeRouteId;
    private int currentWaypointIndex;
    private Integer lastVoyageProfit;
    private List<CargoContractDTO> loadedCargos;
    private boolean hasCargoToUnload;
    private boolean canRepair;
    private boolean canRefuel;

    public FleetShipDTO() {}

    // Backwards-compatible compact constructor (used by existing code/tests)
    public FleetShipDTO(String id, String name, ShipClass shipClass, ShipStatus status,
                        String currentPortId, boolean hasPilot,
                        int fuelLevel, int healthPoints, int maxHealthPoints, int healthPercentage, int fuelConsumptionPerTick,
                        String destinationPortId, List<CargoContractDTO> loadedCargos,
                        boolean hasCargoToUnload) {
        this.id = id;
        this.name = name;
        this.shipClass = shipClass;
        this.status = status;
        this.currentPortId = currentPortId;
        this.hasPilot = hasPilot;
        this.fuelLevel = fuelLevel;
        this.healthPoints = healthPoints;
        this.maxHealthPoints = maxHealthPoints;
        this.healthPercentage = healthPercentage;
        this.fuelConsumptionPerTick = fuelConsumptionPerTick;
        this.destinationPortId = destinationPortId;
        this.loadedCargos = loadedCargos;
        this.hasCargoToUnload = hasCargoToUnload;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ShipClass getShipClass() { return shipClass; }
    public void setShipClass(ShipClass shipClass) { this.shipClass = shipClass; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public ShipStatus getStatus() { return status; }
    public void setStatus(ShipStatus status) { this.status = status; }

    public String getCurrentPortId() { return currentPortId; }
    public void setCurrentPortId(String currentPortId) { this.currentPortId = currentPortId; }

    public boolean isHasPilot() { return hasPilot; }
    public void setHasPilot(boolean hasPilot) { this.hasPilot = hasPilot; }

    public int getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(int fuelLevel) { this.fuelLevel = fuelLevel; }

    public int getHealthPoints() { return healthPoints; }
    public void setHealthPoints(int healthPoints) { this.healthPoints = healthPoints; }

    public int getMaxHealthPoints() { return maxHealthPoints; }
    public void setMaxHealthPoints(int maxHealthPoints) { this.maxHealthPoints = maxHealthPoints; }

    public int getHealthPercentage() { return healthPercentage; }
    public void setHealthPercentage(int healthPercentage) { this.healthPercentage = healthPercentage; }

    public int getFuelConsumptionPerTick() { return fuelConsumptionPerTick; }
    public void setFuelConsumptionPerTick(int fuelConsumptionPerTick) { this.fuelConsumptionPerTick = fuelConsumptionPerTick; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }

    public String getActiveRouteId() { return activeRouteId; }
    public void setActiveRouteId(String activeRouteId) { this.activeRouteId = activeRouteId; }

    public int getCurrentWaypointIndex() { return currentWaypointIndex; }
    public void setCurrentWaypointIndex(int currentWaypointIndex) { this.currentWaypointIndex = currentWaypointIndex; }

    public Integer getLastVoyageProfit() { return lastVoyageProfit; }
    public void setLastVoyageProfit(Integer lastVoyageProfit) { this.lastVoyageProfit = lastVoyageProfit; }

    public List<CargoContractDTO> getLoadedCargos() { return loadedCargos; }
    public void setLoadedCargos(List<CargoContractDTO> loadedCargos) { this.loadedCargos = loadedCargos; }

    public boolean isHasCargoToUnload() { return hasCargoToUnload; }
    public void setHasCargoToUnload(boolean hasCargoToUnload) { this.hasCargoToUnload = hasCargoToUnload; }

    public boolean isCanRepair() { return canRepair; }
    public void setCanRepair(boolean canRepair) { this.canRepair = canRepair; }

    public boolean isCanRefuel() { return canRefuel; }
    public void setCanRefuel(boolean canRefuel) { this.canRefuel = canRefuel; }
}
