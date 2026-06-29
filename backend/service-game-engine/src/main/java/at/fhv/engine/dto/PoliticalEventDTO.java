package at.fhv.engine.dto;

import java.util.List;

// Mirror of the navigation-service DTO. Decoupled so the engine doesn't depend
// on navigation's classpath; same JSON shape over the wire.
public class PoliticalEventDTO {

    public enum Type {
        ROUTE_BLOCKED, ROUTE_ENFORCED, ROUTE_UNBLOCKED,
        PILOT_STRIKE_STARTED, PILOT_STRIKE_ENDED
    }

    private Type type;
    private String blockGroup;
    private String blockType;             // ROUTE | PORT | PILOT | null
    private String headline;
    private String reason;
    private Integer untilTick;
    private Integer durationTicks;
    private Integer gracePeriodTicks;
    private boolean alternativeAvailable;
    private List<PortPair> affectedRoutes;
    private List<AffectedPort> affectedPorts; // for PILOT_STRIKE_* events

    public PoliticalEventDTO() {}

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

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class PortPair {
        private String fromPortId;
        private String toPortId;
        /** Whether THIS specific route offers a detour. Mirrored from navigation:
         *  without this field the flag is dropped on the engine hop and the
         *  frontend treats every blocked canal route as fully closed. */
        private boolean hasAlternative;

        public PortPair() {}

        public String getFromPortId() { return fromPortId; }
        public void setFromPortId(String fromPortId) { this.fromPortId = fromPortId; }

        public String getToPortId() { return toPortId; }
        public void setToPortId(String toPortId) { this.toPortId = toPortId; }

        public boolean isHasAlternative() { return hasAlternative; }
        public void setHasAlternative(boolean hasAlternative) { this.hasAlternative = hasAlternative; }
    }
}
