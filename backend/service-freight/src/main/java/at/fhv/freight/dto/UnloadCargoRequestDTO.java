package at.fhv.freight.dto;

public class UnloadCargoRequestDTO {
    private String playerId;
    private String shipId;
    private int currentTick;

    public UnloadCargoRequestDTO() {}

    public UnloadCargoRequestDTO(String playerId, String shipId, int currentTick) {
        this.playerId = playerId;
        this.shipId = shipId;
        this.currentTick = currentTick;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public int getCurrentTick() { return currentTick; }
    public void setCurrentTick(int currentTick) { this.currentTick = currentTick; }
}
