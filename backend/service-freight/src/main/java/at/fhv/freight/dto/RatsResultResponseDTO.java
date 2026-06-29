package at.fhv.freight.dto;

public class RatsResultResponseDTO {
    private String shipId;
    private boolean success;
    private int cargoLossPercent;
    private int totalDamagePercent;
    private String message;
    private String mode;

    public RatsResultResponseDTO() {}

    public RatsResultResponseDTO(String shipId, boolean success, int cargoLossPercent,
                                 int totalDamagePercent, String message) {
        this(shipId, success, cargoLossPercent, totalDamagePercent, message, null);
    }

    public RatsResultResponseDTO(String shipId, boolean success, int cargoLossPercent,
                                 int totalDamagePercent, String message, String mode) {
        this.shipId = shipId;
        this.success = success;
        this.cargoLossPercent = cargoLossPercent;
        this.totalDamagePercent = totalDamagePercent;
        this.message = message;
        this.mode = mode;
    }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getCargoLossPercent() { return cargoLossPercent; }
    public void setCargoLossPercent(int cargoLossPercent) { this.cargoLossPercent = cargoLossPercent; }

    public int getTotalDamagePercent() { return totalDamagePercent; }
    public void setTotalDamagePercent(int totalDamagePercent) { this.totalDamagePercent = totalDamagePercent; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
