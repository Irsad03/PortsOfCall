package at.fhv.navigation.route.model;

import at.fhv.navigation.route.config.WaypointListConverter;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String fromPortId;

    @Column(nullable = false)
    private String toPortId;

    @Convert(converter = WaypointListConverter.class)
    @Column(columnDefinition = "TEXT", nullable = false)
    private List<Waypoint> waypoints;

    private int totalTicks;

    @Column(name = "block_group")
    private String blockGroup;

    @Column(name = "is_blocked", nullable = false)
    private boolean blocked = false;

    @Column(name = "blocked_until_tick")
    private Integer blockedUntilTick;

    @Column(name = "enforce_from_tick")
    private Integer enforceFromTick;

    @Column(name = "block_reason")
    private String blockReason;

    @Column(name = "block_type")
    private String blockType;

    @Convert(converter = WaypointListConverter.class)
    @Column(name = "alternative_waypoints", columnDefinition = "TEXT")
    private List<Waypoint> alternativeWaypoints;

    @Column(name = "alternative_total_ticks")
    private Integer alternativeTotalTicks;

    public Route() {}

    public Route(String fromPortId, String toPortId, List<Waypoint> waypoints) {
        this.fromPortId = fromPortId;
        this.toPortId = toPortId;
        this.waypoints = waypoints;
        this.totalTicks = waypoints.size() - 1;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFromPortId() { return fromPortId; }
    public void setFromPortId(String fromPortId) { this.fromPortId = fromPortId; }

    public String getToPortId() { return toPortId; }
    public void setToPortId(String toPortId) { this.toPortId = toPortId; }

    public List<Waypoint> getWaypoints() { return waypoints; }
    public void setWaypoints(List<Waypoint> waypoints) {
        this.waypoints = waypoints;
        this.totalTicks = waypoints.size() - 1;
    }

    public int getTotalTicks() { return totalTicks; }

    public String getBlockGroup() { return blockGroup; }
    public void setBlockGroup(String blockGroup) { this.blockGroup = blockGroup; }

    public boolean isBlockable() { return blockGroup != null; }

    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }

    public Integer getBlockedUntilTick() { return blockedUntilTick; }
    public void setBlockedUntilTick(Integer blockedUntilTick) { this.blockedUntilTick = blockedUntilTick; }

    public Integer getEnforceFromTick() { return enforceFromTick; }
    public void setEnforceFromTick(Integer enforceFromTick) { this.enforceFromTick = enforceFromTick; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public String getBlockType() { return blockType; }
    public void setBlockType(String blockType) { this.blockType = blockType; }

    public List<Waypoint> getAlternativeWaypoints() { return alternativeWaypoints; }
    public void setAlternativeWaypoints(List<Waypoint> alternativeWaypoints) {
        this.alternativeWaypoints = alternativeWaypoints;
        this.alternativeTotalTicks = alternativeWaypoints != null && alternativeWaypoints.size() > 1
                ? alternativeWaypoints.size() - 1
                : null;
    }

    public Integer getAlternativeTotalTicks() { return alternativeTotalTicks; }
    public void setAlternativeTotalTicks(Integer alternativeTotalTicks) {
        this.alternativeTotalTicks = alternativeTotalTicks;
    }

    public boolean hasAlternative() { return alternativeWaypoints != null && !alternativeWaypoints.isEmpty(); }
}