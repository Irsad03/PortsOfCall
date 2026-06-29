package at.fhv.freight.dto;

public class OverboardResultResponseDTO {
    private String shipId;
    private boolean success;
    private int hpPenalty;
    private int newHealthPoints;
    private ShipStatus newStatus;

    public OverboardResultResponseDTO() {}

    public OverboardResultResponseDTO(String shipId, boolean success, int hpPenalty,
                                      int newHealthPoints, ShipStatus newStatus) {
        this.shipId = shipId;
        this.success = success;
        this.hpPenalty = hpPenalty;
        this.newHealthPoints = newHealthPoints;
        this.newStatus = newStatus;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getHpPenalty() { return hpPenalty; }
    public void setHpPenalty(int hpPenalty) { this.hpPenalty = hpPenalty; }

    public int getNewHealthPoints() { return newHealthPoints; }
    public void setNewHealthPoints(int newHealthPoints) { this.newHealthPoints = newHealthPoints; }

    public ShipStatus getNewStatus() { return newStatus; }
    public void setNewStatus(ShipStatus newStatus) { this.newStatus = newStatus; }
}
