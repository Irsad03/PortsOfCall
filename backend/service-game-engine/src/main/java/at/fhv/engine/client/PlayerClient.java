package at.fhv.engine.client;

import at.fhv.engine.dto.PlayerDTO;
import at.fhv.engine.dto.UpdatePositionRequestDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
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

    public List<PlayerDTO> getPlayersBySession(String sessionId) {
        try {
            PlayerDTO[] arr = restTemplate.getForObject(
                    playerServiceUrl + "/api/players/session/" + sessionId, PlayerDTO[].class);
            return arr == null ? List.of() : Arrays.asList(arr);
        } catch (Exception ex) {
            log.warn("player-service unavailable while fetching players for session {}: {}",
                    sessionId, ex.getMessage());
            return List.of();
        }
    }

    public void updatePosition(String playerId, int x, int y) {
        try {
            restTemplate.put(
                    playerServiceUrl + "/api/players/" + playerId + "/position",
                    new UpdatePositionRequestDTO(x, y));
        } catch (Exception ex) {
            log.warn("player-service unavailable while updating position for {}: {}",
                    playerId, ex.getMessage());
        }
    }

    public PlayerDTO updateMoney(String playerId, int delta) {
        try {
            org.springframework.http.HttpEntity<at.fhv.engine.dto.UpdateMoneyRequestDTO> body =
                    new org.springframework.http.HttpEntity<>(
                            new at.fhv.engine.dto.UpdateMoneyRequestDTO(delta));
            return restTemplate.exchange(
                    playerServiceUrl + "/api/players/" + playerId + "/money",
                    org.springframework.http.HttpMethod.PUT,
                    body, PlayerDTO.class).getBody();
        } catch (Exception ex) {
            log.warn("player-service unavailable while crediting money for {}: {}",
                    playerId, ex.getMessage());
            return null;
        }
    }
}
