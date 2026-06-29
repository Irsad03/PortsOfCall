package at.fhv.freight.dto;

public class ParkingResultResponseDTO {
    private String shipId;
    private boolean success;
    private String message;
    private int damageApplied;
    private int remainingHp;

    public ParkingResultResponseDTO() {}

    public ParkingResultResponseDTO(String shipId, boolean success, String message,
                                    int damageApplied, int remainingHp) {
        this.shipId = shipId;
        this.success = success;
        this.message = message;
        this.damageApplied = damageApplied;
        this.remainingHp = remainingHp;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getDamageApplied() { return damageApplied; }
    public void setDamageApplied(int damageApplied) { this.damageApplied = damageApplied; }

    public int getRemainingHp() { return remainingHp; }
    public void setRemainingHp(int remainingHp) { this.remainingHp = remainingHp; }
}
