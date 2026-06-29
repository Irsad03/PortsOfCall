package at.fhv.engine.dto;

import java.util.List;

public class RouteDTO {
    private String id;
    private String fromPortId;
    private String toPortId;
    private List<WaypointDTO> waypoints;
    private int totalTicks;

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
}