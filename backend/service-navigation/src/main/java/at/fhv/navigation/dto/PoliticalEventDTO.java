package at.fhv.navigation.dto;

import java.util.List;


public class PoliticalEventDTO {

    public enum Type {
        ROUTE_BLOCKED, ROUTE_ENFORCED, ROUTE_UNBLOCKED,
        PILOT_STRIKE_STARTED, PILOT_STRIKE_ENDED
    }

    private Type type;
    private String blockGroup;          // e.g. SUEZ_CANAL
    private String blockType;           // ROUTE | PORT — controls whether alternative can apply
    private String headline;
    private String reason;
    private Integer untilTick;
    private Integer durationTicks;
    private Integer gracePeriodTicks;   // for BLOCKED — how many ticks until enforcement kicks in
    private boolean alternativeAvailable; // true if affected routes have pre-computed alternative waypoints
    private List<PortPair> affectedRoutes;
    private List<AffectedPort> affectedPorts;

    public PoliticalEventDTO() {}

    public PoliticalEventDTO(Type type, String blockGroup, String blockType, String headline, String reason,
                             Integer untilTick, Integer durationTicks, Integer gracePeriodTicks,
                             boolean alternativeAvailable, List<PortPair> affectedRoutes) {
        this.type = type;
        this.blockGroup = blockGroup;
        this.blockType = blockType;
        this.headline = headline;
        this.reason = reason;
        this.untilTick = untilTick;
        this.durationTicks = durationTicks;
        this.gracePeriodTicks = gracePeriodTicks;
        this.alternativeAvailable = alternativeAvailable;
        this.affectedRoutes = affectedRoutes;
    }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getBlockGroup() { return blockGroup; }
    public void setBlockGroup(String blockGroup) { this.blockGroup = blockGroup; }

    public String getBlockType() { return blockType; }
    public void setBlockType(String blockType) { this.blockType = blockType; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getUntilTick() { return untilTick; }
    public void setUntilTick(Integer untilTick) { this.untilTick = untilTick; }

    public Integer getDurationTicks() { return durationTicks; }
    public void setDurationTicks(Integer durationTicks) { this.durationTicks = durationTicks; }

    public Integer getGracePeriodTicks() { return gracePeriodTicks; }
    public void setGracePeriodTicks(Integer gracePeriodTicks) { this.gracePeriodTicks = gracePeriodTicks; }

    public boolean isAlternativeAvailable() { return alternativeAvailable; }
    public void setAlternativeAvailable(boolean alternativeAvailable) {
        this.alternativeAvailable = alternativeAvailable;
    }

    public List<PortPair> getAffectedRoutes() { return affectedRoutes; }
    public void setAffectedRoutes(List<PortPair> affectedRoutes) { this.affectedRoutes = affectedRoutes; }

    public List<AffectedPort> getAffectedPorts() { return affectedPorts; }
    public void setAffectedPorts(List<AffectedPort> affectedPorts) { this.affectedPorts = affectedPorts; }

    public static class AffectedPort {
        private String id;
        private String name;

        public AffectedPort() {}
        public AffectedPort(String id, String name) {
            this.id = id;
            this.name = name;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class PortPair {
        private String fromPortId;
        private String toPortId;
        private boolean hasAlternative;

        public PortPair() {}
        public PortPair(String fromPortId, String toPortId, boolean hasAlternative) {
            this.fromPortId = fromPortId;
            this.toPortId = toPortId;
            this.hasAlternative = hasAlternative;
        }

        public String getFromPortId() { return fromPortId; }
        public void setFromPortId(String fromPortId) { this.fromPortId = fromPortId; }

        public String getToPortId() { return toPortId; }
        public void setToPortId(String toPortId) { this.toPortId = toPortId; }

        public boolean isHasAlternative() { return hasAlternative; }
        public void setHasAlternative(boolean hasAlternative) { this.hasAlternative = hasAlternative; }
    }
}
