package at.fhv.engine.dto;

import java.io.Serializable;

public class MinigameEventMessageDTO implements Serializable {
    private String sessionId;
    private String shipId;
    private String playerId;
    private String eventType;
    private String variant;

    public MinigameEventMessageDTO() {}

    public MinigameEventMessageDTO(String sessionId, String shipId, String playerId, String eventType) {
        this.sessionId = sessionId;
        this.shipId = shipId;
        this.playerId = playerId;
        this.eventType = eventType;
    }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getShipId() {
        return shipId;
    }

    public void setShipId(String shipId) {
        this.shipId = shipId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}