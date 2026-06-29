package at.fhv.session.client;

import at.fhv.session.dto.LeaderboardEntryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class PlayerClient {

    private static final Logger log = LoggerFactory.getLogger(PlayerClient.class);

    private final RestTemplate restTemplate;
    private final String playerServiceUrl;

    public PlayerClient(RestTemplate restTemplate,
                        @Value("${services.player.url}") String playerServiceUrl) {
        this.restTemplate = restTemplate;
        this.playerServiceUrl = playerServiceUrl;
    }

    public List<LeaderboardEntryDTO> getLeaderboardForSession(String sessionId) {
        try {
            LeaderboardEntryDTO[] entries = restTemplate.getForObject(
                    playerServiceUrl + "/api/players/session/" + sessionId + "/leaderboard",
                    LeaderboardEntryDTO[].class);
            return entries == null ? List.of() : List.of(entries);
        } catch (Exception ex) {
            log.warn("player-service unavailable while building leaderboard ({}): {}",
                    sessionId, ex.getMessage());
            return List.of();
        }
    }
}
