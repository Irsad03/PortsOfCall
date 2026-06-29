package at.fhv.freight.dto;

public class CustomsInspectionDTO {
    private String shipId;
    private String playerId;
    private String sessionId;
    private boolean hasIllegalGoods;
    private int illegalValue;

    public CustomsInspectionDTO() {}

    public CustomsInspectionDTO(String shipId, String playerId, String sessionId, boolean hasIllegalGoods, int illegalValue) {
        this.shipId = shipId;
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.hasIllegalGoods = hasIllegalGoods;
        this.illegalValue = illegalValue;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public boolean isHasIllegalGoods() { return hasIllegalGoods; }
    public void setHasIllegalGoods(boolean hasIllegalGoods) { this.hasIllegalGoods = hasIllegalGoods; }

    public int getIllegalValue() { return illegalValue; }
    public void setIllegalValue(int illegalValue) { this.illegalValue = illegalValue; }
}
