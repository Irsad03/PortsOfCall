package at.fhv.freight.client;

import at.fhv.freight.dto.PlayerDTO;
import at.fhv.freight.dto.UpdateCurrentShipRequestDTO;
import at.fhv.freight.dto.UpdateMoneyRequestDTO;
import at.fhv.freight.dto.UpdatePositionRequestDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

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

    public PlayerDTO getPlayer(String playerId) {
        try {
            return restTemplate.getForObject(
                    playerServiceUrl + "/api/players/" + playerId, PlayerDTO.class);
        } catch (HttpClientErrorException.NotFound nf) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found: " + playerId);
        } catch (Exception ex) {
            log.warn("player-service unavailable while fetching player {}: {}", playerId, ex.getMessage());
            return null;
        }
    }

    public PlayerDTO updateMoney(String playerId, int delta) {
        return updateMoney(playerId, delta, false);
    }

    public PlayerDTO updateMoney(String playerId, int delta, boolean clampAtZero) {
        try {
            return restTemplate.exchange(
                    playerServiceUrl + "/api/players/" + playerId + "/money",
                    HttpMethod.PUT,
                    new HttpEntity<>(new UpdateMoneyRequestDTO(delta, clampAtZero)),
                    PlayerDTO.class
            ).getBody();
        } catch (HttpClientErrorException ex) {

            throw new ResponseStatusException(ex.getStatusCode(),
                    extractMessage(ex.getResponseBodyAsString(), ex.getStatusText()));
        } catch (Exception ex) {
            log.warn("player-service unavailable while updating money for {}: {}", playerId, ex.getMessage());
            return null;
        }
    }

    public void updatePosition(String playerId, int x, int y) {
        try {
            restTemplate.put(
                    playerServiceUrl + "/api/players/" + playerId + "/position",
                    new UpdatePositionRequestDTO(x, y));
        } catch (Exception ex) {
            log.warn("player-service unavailable while updating position for {}: {}", playerId, ex.getMessage());
        }
    }

    private String extractMessage(String body, String fallback) {
        if (body == null || body.isBlank()) return fallback;
        try {
            com.fasterxml.jackson.databind.JsonNode node =
                    new com.fasterxml.jackson.databind.ObjectMapper().readTree(body);
            com.fasterxml.jackson.databind.JsonNode msg = node.get("message");
            if (msg == null || msg.isNull()) msg = node.get("detail");
            if (msg != null && !msg.isNull()) return msg.asText();
            return body;
        } catch (Exception ex) {
            return body;
        }
    }

    public void updateCurrentShip(String playerId, String shipId) {
        try {
            restTemplate.put(
                    playerServiceUrl + "/api/players/" + playerId + "/current-ship",
                    new UpdateCurrentShipRequestDTO(shipId));
        } catch (Exception ex) {
            log.warn("player-service unavailable while updating current ship for {}: {}", playerId, ex.getMessage());
        }
    }
}
