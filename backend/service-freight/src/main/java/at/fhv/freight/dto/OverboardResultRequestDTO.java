package at.fhv.freight.dto;

public class OverboardResultRequestDTO {
    private boolean success;
    private long rescueTimeMs;

    public OverboardResultRequestDTO() {}

    public OverboardResultRequestDTO(boolean success, long rescueTimeMs) {
        this.success = success;
        this.rescueTimeMs = rescueTimeMs;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public long getRescueTimeMs() { return rescueTimeMs; }
    public void setRescueTimeMs(long rescueTimeMs) { this.rescueTimeMs = rescueTimeMs; }
}
