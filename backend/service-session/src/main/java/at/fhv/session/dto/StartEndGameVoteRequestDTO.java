package at.fhv.session.dto;

public class StartEndGameVoteRequestDTO {
    private String playerId;

    public StartEndGameVoteRequestDTO() {}

    public StartEndGameVoteRequestDTO(String playerId) {
        this.playerId = playerId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }
}
