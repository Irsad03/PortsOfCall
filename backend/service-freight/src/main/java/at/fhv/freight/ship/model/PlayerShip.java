package at.fhv.freight.ship.model;

import at.fhv.freight.dto.CustomsStatus;
import at.fhv.freight.dto.ShipClass;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.dto.SmugglingOfferDTO;
import at.fhv.freight.ship.config.SmugglingOfferConverter;
import at.fhv.freight.ship.config.WaypointListConverter;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "player_ships")
public class PlayerShip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "player_id", nullable = false)
    private String playerId;

    @Column(name = "session_id")
    private String sessionId;

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
    private boolean isUsed = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipStatus status = ShipStatus.IDLE;

    @Column(name = "current_port_id")
    private String currentPortId;

    @Column(nullable = false)
    private int fuelLevel = 100;

    @Column(nullable = false)
    private int reserveFuel = 0;

    @Column(nullable = false)
    private int reserveFuelCapacity = 0;

    @Column(nullable = false)
    private int fuelConsumptionPerTick = 5;

    @Column(nullable = false)
    private int healthPoints = 100;

    @Column(nullable = false)
    private int maxHealthPoints = 100;

    private boolean hasPilot = false;

    private String activeRouteId;
    private int currentWaypointIndex = 0;
    // Distance travelled along the active route's polyline (chord lengths,
    // map-space units). Drives distance-based movement & fuel. 0 when not sailing.
    @Column(nullable = false)
    private double routeProgress = 0.0;
    private String destinationPortId;
    private Integer routeStartTick;
    private Integer routeTotalTicks;

    @Convert(converter = WaypointListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Waypoint> activeRouteWaypoints;

    @Column(nullable = false)
    private boolean usingAlternativeRoute = false;

    private Integer lastVoyageProfit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomsStatus customsStatus = CustomsStatus.NONE;

    @Column(nullable = false)
    private int customsHoldRemainingTicks = 0;

    private Boolean customsProcessingCleared;

    @Column(nullable = false)
    private int customsProcessingFine = 0;


    @Convert(converter = SmugglingOfferConverter.class)
    @Column(columnDefinition = "TEXT")
    private SmugglingOfferDTO pendingSmugglingOffer;

    @Column(name = "pending_route_destination_port_id")
    private String pendingRouteDestinationPortId;

    @Column(nullable = false)
    private boolean minigameDoneThisVoyage = false;

    @Column(nullable = false)
    private boolean ratsActive = false;

    @Column(nullable = false)
    private int ratsTicks = 0;

    private String ratsMode;

    @Column(nullable = false)
    private LocalDateTime purchasedAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean mortgaged = false;

    public PlayerShip() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

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

    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { isUsed = used; }

    public ShipStatus getStatus() { return status; }
    public void setStatus(ShipStatus status) { this.status = status; }

    public String getCurrentPortId() { return currentPortId; }
    public void setCurrentPortId(String currentPortId) { this.currentPortId = currentPortId; }

    public int getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(int fuelLevel) { this.fuelLevel = Math.max(0, Math.min(100, fuelLevel)); }

    public int getReserveFuel() { return reserveFuel; }
    public void setReserveFuel(int reserveFuel) { this.reserveFuel = Math.max(0, reserveFuel); }

    public int getReserveFuelCapacity() { return reserveFuelCapacity; }
    public void setReserveFuelCapacity(int reserveFuelCapacity) { this.reserveFuelCapacity = Math.max(0, reserveFuelCapacity); }

    public int getFuelConsumptionPerTick() { return fuelConsumptionPerTick; }
    public void setFuelConsumptionPerTick(int fuelConsumptionPerTick) { this.fuelConsumptionPerTick = fuelConsumptionPerTick; }

    public int getHealthPoints() { return healthPoints; }
    public void setHealthPoints(int healthPoints) { this.healthPoints = Math.max(0, Math.min(100, healthPoints)); }

    public int getMaxHealthPoints() { return maxHealthPoints; }
    public void setMaxHealthPoints(int maxHealthPoints) { this.maxHealthPoints = Math.max(0, Math.min(100, maxHealthPoints)); }

    public boolean isHasPilot() { return hasPilot; }
    public void setHasPilot(boolean hasPilot) { this.hasPilot = hasPilot; }

    public String getActiveRouteId() { return activeRouteId; }
    public void setActiveRouteId(String activeRouteId) { this.activeRouteId = activeRouteId; }

    public int getCurrentWaypointIndex() { return currentWaypointIndex; }
    public void setCurrentWaypointIndex(int currentWaypointIndex) { this.currentWaypointIndex = currentWaypointIndex; }

    public double getRouteProgress() { return routeProgress; }
    public void setRouteProgress(double routeProgress) { this.routeProgress = routeProgress; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }

    public Integer getRouteStartTick() { return routeStartTick; }
    public void setRouteStartTick(Integer routeStartTick) { this.routeStartTick = routeStartTick; }

    public Integer getRouteTotalTicks() { return routeTotalTicks; }
    public void setRouteTotalTicks(Integer routeTotalTicks) { this.routeTotalTicks = routeTotalTicks; }

    public List<Waypoint> getActiveRouteWaypoints() { return activeRouteWaypoints; }
    public void setActiveRouteWaypoints(List<Waypoint> activeRouteWaypoints) { this.activeRouteWaypoints = activeRouteWaypoints; }

    public boolean isUsingAlternativeRoute() { return usingAlternativeRoute; }
    public void setUsingAlternativeRoute(boolean usingAlternativeRoute) { this.usingAlternativeRoute = usingAlternativeRoute; }

    public Integer getLastVoyageProfit() { return lastVoyageProfit; }
    public void setLastVoyageProfit(Integer lastVoyageProfit) { this.lastVoyageProfit = lastVoyageProfit; }

    public boolean isMinigameDoneThisVoyage() { return minigameDoneThisVoyage; }
    public void setMinigameDoneThisVoyage(boolean minigameDoneThisVoyage) { this.minigameDoneThisVoyage = minigameDoneThisVoyage; }

    public boolean isRatsActive() { return ratsActive; }
    public void setRatsActive(boolean ratsActive) { this.ratsActive = ratsActive; }

    public int getRatsTicks() { return ratsTicks; }
    public void setRatsTicks(int ratsTicks) { this.ratsTicks = ratsTicks; }

    public String getRatsMode() { return ratsMode; }
    public void setRatsMode(String ratsMode) { this.ratsMode = ratsMode; }

    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }

    public boolean isMortgaged() { return mortgaged; }
    public void setMortgaged(boolean mortgaged) { this.mortgaged = mortgaged; }

    public CustomsStatus getCustomsStatus() { return customsStatus; }
    public void setCustomsStatus(CustomsStatus customsStatus) { this.customsStatus = customsStatus; }

    public int getCustomsHoldRemainingTicks() { return customsHoldRemainingTicks; }
    public void setCustomsHoldRemainingTicks(int customsHoldRemainingTicks) { this.customsHoldRemainingTicks = customsHoldRemainingTicks; }

    public Boolean getCustomsProcessingCleared() { return customsProcessingCleared; }
    public void setCustomsProcessingCleared(Boolean customsProcessingCleared) { this.customsProcessingCleared = customsProcessingCleared; }

    public int getCustomsProcessingFine() { return customsProcessingFine; }
    public void setCustomsProcessingFine(int customsProcessingFine) { this.customsProcessingFine = customsProcessingFine; }

    public SmugglingOfferDTO getPendingSmugglingOffer() { return pendingSmugglingOffer; }
    public void setPendingSmugglingOffer(SmugglingOfferDTO pendingSmugglingOffer) { this.pendingSmugglingOffer = pendingSmugglingOffer; }

    public String getPendingRouteDestinationPortId() { return pendingRouteDestinationPortId; }
    public void setPendingRouteDestinationPortId(String pendingRouteDestinationPortId) { this.pendingRouteDestinationPortId = pendingRouteDestinationPortId; }
}
