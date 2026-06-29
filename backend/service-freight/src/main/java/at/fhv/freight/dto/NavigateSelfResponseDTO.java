package at.fhv.freight.dto;

public class NavigateSelfResponseDTO {
    private String shipId;
    private String shipStatus;

    public NavigateSelfResponseDTO() {}

    public NavigateSelfResponseDTO(String shipId, String shipStatus) {
        this.shipId = shipId;
        this.shipStatus = shipStatus;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipStatus() { return shipStatus; }
    public void setShipStatus(String shipStatus) { this.shipStatus = shipStatus; }
}
