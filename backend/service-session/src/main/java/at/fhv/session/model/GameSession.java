package at.fhv.session.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "game_sessions")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    private String creatorPlayerId;

    private int maxPlayers = 6;
    private int currentTick = 0;

    @Version
    private Long version;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "session_players", joinColumns = @JoinColumn(name = "session_id"))
    private List<SessionPlayer> players = new ArrayList<>();

    private boolean endGameVoteStarted = false;

    @ElementCollection
    @CollectionTable(name = "session_end_game_votes", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "player_id")
    @Column(name = "vote")
    private Map<String, Boolean> endGameVotes = new HashMap<>();

    private Long nextEndGameVoteAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public String getCreatorPlayerId() { return creatorPlayerId; }
    public void setCreatorPlayerId(String creatorPlayerId) { this.creatorPlayerId = creatorPlayerId; }

    public int getMaxPlayers() { return maxPlayers; }
    public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }

    // BUG-24: derived from players list to prevent counter/list drift
    public int getCurrentPlayers() { return players.size(); }

    public int getCurrentTick() { return currentTick; }
    public void setCurrentTick(int currentTick) { this.currentTick = currentTick; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public List<SessionPlayer> getPlayers() { return players; }
    public void setPlayers(List<SessionPlayer> players) { this.players = players; }

    public boolean isEndGameVoteStarted() { return endGameVoteStarted; }
    public void setEndGameVoteStarted(boolean endGameVoteStarted) { this.endGameVoteStarted = endGameVoteStarted; }

    public Map<String, Boolean> getEndGameVotes() { return endGameVotes; }
    public void setEndGameVotes(Map<String, Boolean> endGameVotes) { this.endGameVotes = endGameVotes; }

    public Long getNextEndGameVoteAt() { return nextEndGameVoteAt; }
    public void setNextEndGameVoteAt(Long nextEndGameVoteAt) { this.nextEndGameVoteAt = nextEndGameVoteAt; }
}
