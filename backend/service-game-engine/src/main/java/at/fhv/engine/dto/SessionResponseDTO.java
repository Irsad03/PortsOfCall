package at.fhv.engine.dto;

import java.util.List;

public class SessionResponseDTO {
    private String id;
    private String code;
    private SessionStatus status;
    private String creatorPlayerId;
    private String creatorName;
    private int currentPlayers;
    private int maxPlayers;
    private int currentTick;
    private String playerId;
    private String playerName;
    private List<LobbyPlayerDTO> players;

    public SessionResponseDTO() {}

    public SessionResponseDTO(String id, String code, SessionStatus status,
                              String creatorPlayerId, String creatorName,
                              int currentPlayers, int maxPlayers, int currentTick,
                              String playerId, String playerName,
                              List<LobbyPlayerDTO> players) {
        this.id = id;
        this.code = code;
        this.status = status;
        this.creatorPlayerId = creatorPlayerId;
        this.creatorName = creatorName;
        this.currentPlayers = currentPlayers;
        this.maxPlayers = maxPlayers;
        this.currentTick = currentTick;
        this.playerId = playerId;
        this.playerName = playerName;
        this.players = players;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public String getCreatorPlayerId() { return creatorPlayerId; }
    public void setCreatorPlayerId(String creatorPlayerId) { this.creatorPlayerId = creatorPlayerId; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }

    public int getCurrentPlayers() { return currentPlayers; }
    public void setCurrentPlayers(int currentPlayers) { this.currentPlayers = currentPlayers; }

    public int getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }

    public int getCurrentTick() { return currentTick; }
    public void setCurrentTick(int currentTick) { this.currentTick = currentTick; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public List<LobbyPlayerDTO> getPlayers() { return players; }
    public void setPlayers(List<LobbyPlayerDTO> players) { this.players = players; }
}