package at.fhv.freight.dto;

import java.util.List;

public class FleetShipDTO {
    private String id;
    private String playerId;
    private String name;
    private ShipClass shipClass;
    private int price;
    private int sellPrice;
    private boolean mortgaged;
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

    private List<WaypointDTO> activeRouteWaypoints;
    private int currentWaypointIndex;

    private double distancePerTick = 0;
    private double routeProgress = 0;

    private boolean usingAlternativeRoute;

    private int reserveFuel;
    private int reserveFuelCapacity;
    private Integer lastVoyageProfit;
    private List<CargoContractDTO> loadedCargos;
    private boolean hasCargoToUnload;
    private boolean canRepair;
    private boolean canRefuel;
    private CustomsStatus customsStatus = CustomsStatus.NONE;
    private int customsHoldRemainingTicks;
    private boolean ratsActive;
    private int ratsTicks;
    private String ratsMode;

    public FleetShipDTO() {}

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

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public int getSellPrice() { return sellPrice; }
    public void setSellPrice(int sellPrice) { this.sellPrice = sellPrice; }

    public boolean isMortgaged() { return mortgaged; }
    public void setMortgaged(boolean mortgaged) { this.mortgaged = mortgaged; }

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

    public List<WaypointDTO> getActiveRouteWaypoints() { return activeRouteWaypoints; }
    public void setActiveRouteWaypoints(List<WaypointDTO> activeRouteWaypoints) {
        this.activeRouteWaypoints = activeRouteWaypoints;
    }

    public int getCurrentWaypointIndex() { return currentWaypointIndex; }
    public void setCurrentWaypointIndex(int currentWaypointIndex) { this.currentWaypointIndex = currentWaypointIndex; }

    public double getDistancePerTick() { return distancePerTick; }
    public void setDistancePerTick(double distancePerTick) { this.distancePerTick = distancePerTick; }

    public double getRouteProgress() { return routeProgress; }
    public void setRouteProgress(double routeProgress) { this.routeProgress = routeProgress; }

    public boolean isUsingAlternativeRoute() { return usingAlternativeRoute; }
    public void setUsingAlternativeRoute(boolean usingAlternativeRoute) { this.usingAlternativeRoute = usingAlternativeRoute; }

    public int getReserveFuel() { return reserveFuel; }
    public void setReserveFuel(int reserveFuel) { this.reserveFuel = reserveFuel; }

    public int getReserveFuelCapacity() { return reserveFuelCapacity; }
    public void setReserveFuelCapacity(int reserveFuelCapacity) { this.reserveFuelCapacity = reserveFuelCapacity; }

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

    public CustomsStatus getCustomsStatus() { return customsStatus; }
    public void setCustomsStatus(CustomsStatus customsStatus) { this.customsStatus = customsStatus; }

    public int getCustomsHoldRemainingTicks() { return customsHoldRemainingTicks; }
    public void setCustomsHoldRemainingTicks(int customsHoldRemainingTicks) { this.customsHoldRemainingTicks = customsHoldRemainingTicks; }

    public boolean isRatsActive() { return ratsActive; }
    public void setRatsActive(boolean ratsActive) { this.ratsActive = ratsActive; }

    public int getRatsTicks() { return ratsTicks; }
    public void setRatsTicks(int ratsTicks) { this.ratsTicks = ratsTicks; }

    public String getRatsMode() { return ratsMode; }
    public void setRatsMode(String ratsMode) { this.ratsMode = ratsMode; }
}