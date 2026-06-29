package at.fhv.freight.dto;

public class ParkingResultRequestDTO {
    private String playerId;
    private String shipId;
    private boolean success;
    private int score;

    public ParkingResultRequestDTO() {}

    public ParkingResultRequestDTO(String playerId, String shipId, boolean success, int score) {
        this.playerId = playerId;
        this.shipId = shipId;
        this.success = success;
        this.score = score;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
