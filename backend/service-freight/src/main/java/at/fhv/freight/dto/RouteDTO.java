package at.fhv.freight.dto;

import java.util.List;

public class RouteDTO {
    private String id;
    private String fromPortId;
    private String toPortId;
    private List<WaypointDTO> waypoints;
    private int totalTicks;

    private boolean blocked;
    private Integer blockedUntilTick;
    private String blockReason;
    private String blockGroup;
    private String blockType;             // ROUTE | PORT | null

    private List<WaypointDTO> alternativeWaypoints;
    private Integer alternativeTotalTicks;
    private boolean hasAlternative;

    public RouteDTO() {}

    public RouteDTO(String id, String fromPortId, String toPortId,
                    List<WaypointDTO> waypoints, int totalTicks) {
        this.id = id;
        this.fromPortId = fromPortId;
        this.toPortId = toPortId;
        this.waypoints = waypoints;
        this.totalTicks = totalTicks;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFromPortId() { return fromPortId; }
    public void setFromPortId(String fromPortId) { this.fromPortId = fromPortId; }

    public String getToPortId() { return toPortId; }
    public void setToPortId(String toPortId) { this.toPortId = toPortId; }

    public List<WaypointDTO> getWaypoints() { return waypoints; }
    public void setWaypoints(List<WaypointDTO> waypoints) { this.waypoints = waypoints; }

    public int getTotalTicks() { return totalTicks; }
    public void setTotalTicks(int totalTicks) { this.totalTicks = totalTicks; }

    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }

    public Integer getBlockedUntilTick() { return blockedUntilTick; }
    public void setBlockedUntilTick(Integer blockedUntilTick) { this.blockedUntilTick = blockedUntilTick; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public String getBlockGroup() { return blockGroup; }
    public void setBlockGroup(String blockGroup) { this.blockGroup = blockGroup; }

    public String getBlockType() { return blockType; }
    public void setBlockType(String blockType) { this.blockType = blockType; }

    public List<WaypointDTO> getAlternativeWaypoints() { return alternativeWaypoints; }
    public void setAlternativeWaypoints(List<WaypointDTO> alternativeWaypoints) {
        this.alternativeWaypoints = alternativeWaypoints;
    }

    public Integer getAlternativeTotalTicks() { return alternativeTotalTicks; }
    public void setAlternativeTotalTicks(Integer alternativeTotalTicks) {
        this.alternativeTotalTicks = alternativeTotalTicks;
    }

    public boolean isHasAlternative() { return hasAlternative; }
    public void setHasAlternative(boolean hasAlternative) { this.hasAlternative = hasAlternative; }

    // Whether the alternative should be used right now: route is blocked, it's
    // a route-targeted block (not port) and alternative waypoints are present.
    public boolean shouldUseAlternative() {
        return blocked
                && "ROUTE".equals(blockType)
                && alternativeWaypoints != null
                && !alternativeWaypoints.isEmpty();
    }
}
