package at.fhv.engine.dto;

import java.util.List;

public class GameStateMessageDTO {
    private String sessionId;
    private int currentTick;
    private List<PlayerStateDTO> players;
    private List<ActiveShipStateDTO> activeShips;

    public GameStateMessageDTO() {}

    public GameStateMessageDTO(String sessionId, int currentTick,
                               List<PlayerStateDTO> players,
                               List<ActiveShipStateDTO> activeShips) {
        this.sessionId = sessionId;
        this.currentTick = currentTick;
        this.players = players;
        this.activeShips = activeShips;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public int getCurrentTick() { return currentTick; }
    public void setCurrentTick(int currentTick) { this.currentTick = currentTick; }

    public List<PlayerStateDTO> getPlayers() { return players; }
    public void setPlayers(List<PlayerStateDTO> players) { this.players = players; }

    public List<ActiveShipStateDTO> getActiveShips() { return activeShips; }
    public void setActiveShips(List<ActiveShipStateDTO> activeShips) { this.activeShips = activeShips; }
}