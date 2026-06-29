package at.fhv.session.dto;

public class JoinSessionRequestDTO {
    private String sessionCode;
    private String playerId;
    private String playerName;

    public JoinSessionRequestDTO() {}

    public JoinSessionRequestDTO(String sessionCode, String playerId, String playerName) {
        this.sessionCode = sessionCode;
        this.playerId = playerId;
        this.playerName = playerName;
    }

    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }
}
