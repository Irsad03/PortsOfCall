package at.fhv.engine.dto;

public class TickMessageDTO {
    private String sessionId;
    private int currentTick;

    public TickMessageDTO() {}

    public TickMessageDTO(String sessionId, int currentTick) {
        this.sessionId = sessionId;
        this.currentTick = currentTick;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public int getCurrentTick() { return currentTick; }
    public void setCurrentTick(int currentTick) { this.currentTick = currentTick; }
}