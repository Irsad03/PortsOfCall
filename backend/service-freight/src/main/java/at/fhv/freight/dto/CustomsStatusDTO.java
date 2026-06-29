package at.fhv.freight.dto;

public class CustomsStatusDTO {
    private String shipId;
    private CustomsStatus customsStatus;
    private int holdRemainingTicks;

    public CustomsStatusDTO() {}

    public CustomsStatusDTO(String shipId, CustomsStatus customsStatus, int holdRemainingTicks) {
        this.shipId = shipId;
        this.customsStatus = customsStatus;
        this.holdRemainingTicks = holdRemainingTicks;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public CustomsStatus getCustomsStatus() { return customsStatus; }
    public void setCustomsStatus(CustomsStatus customsStatus) { this.customsStatus = customsStatus; }

    public int getHoldRemainingTicks() { return holdRemainingTicks; }
    public void setHoldRemainingTicks(int holdRemainingTicks) { this.holdRemainingTicks = holdRemainingTicks; }
}
