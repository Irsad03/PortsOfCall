package at.fhv.engine.dto;

import java.util.List;

public class ActiveShipStateDTO {
    private String playerId;
    private String playerName;
    private String shipId;
    private String shipName;
    private String status;
    private int currentWaypointIndex;
    private double distancePerTick = 0;
    private double routeProgress = 0;
    private List<WaypointDTO> activeRouteWaypoints;
    private String currentPortId;
    private String customsStatus;

    public ActiveShipStateDTO() {}

    public ActiveShipStateDTO(String playerId, String playerName, String shipId, String shipName,
                              String status, int currentWaypointIndex,
                              List<WaypointDTO> activeRouteWaypoints, String currentPortId) {
        this(playerId, playerName, shipId, shipName, status, currentWaypointIndex,
                activeRouteWaypoints, currentPortId, null);
    }

    public ActiveShipStateDTO(String playerId, String playerName, String shipId, String shipName,
                              String status, int currentWaypointIndex,
                              List<WaypointDTO> activeRouteWaypoints, String currentPortId,
                              String customsStatus) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.shipId = shipId;
        this.shipName = shipName;
        this.status = status;
        this.currentWaypointIndex = currentWaypointIndex;
        this.activeRouteWaypoints = activeRouteWaypoints;
        this.currentPortId = currentPortId;
        this.customsStatus = customsStatus;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getCurrentWaypointIndex() { return currentWaypointIndex; }
    public void setCurrentWaypointIndex(int currentWaypointIndex) { this.currentWaypointIndex = currentWaypointIndex; }

    public double getDistancePerTick() { return distancePerTick; }
    public void setDistancePerTick(double distancePerTick) { this.distancePerTick = distancePerTick; }

    public double getRouteProgress() { return routeProgress; }
    public void setRouteProgress(double routeProgress) { this.routeProgress = routeProgress; }

    public List<WaypointDTO> getActiveRouteWaypoints() { return activeRouteWaypoints; }
    public void setActiveRouteWaypoints(List<WaypointDTO> activeRouteWaypoints) { this.activeRouteWaypoints = activeRouteWaypoints; }

    public String getCurrentPortId() { return currentPortId; }
    public void setCurrentPortId(String currentPortId) { this.currentPortId = currentPortId; }

    public String getCustomsStatus() { return customsStatus; }
    public void setCustomsStatus(String customsStatus) { this.customsStatus = customsStatus; }
}
