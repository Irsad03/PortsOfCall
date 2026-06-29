package at.fhv.freight.dto;

public class UpdateCurrentShipRequestDTO {
    private String shipId;

    public UpdateCurrentShipRequestDTO() {}

    public UpdateCurrentShipRequestDTO(String shipId) {
        this.shipId = shipId;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }
}
