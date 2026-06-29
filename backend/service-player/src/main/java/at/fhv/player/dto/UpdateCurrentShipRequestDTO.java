package at.fhv.player.dto;

// Sets the active ship pointer for a player. Pass null/empty shipId to clear it.
public class UpdateCurrentShipRequestDTO {
    private String shipId;

    public UpdateCurrentShipRequestDTO() {}

    public UpdateCurrentShipRequestDTO(String shipId) {
        this.shipId = shipId;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }
}