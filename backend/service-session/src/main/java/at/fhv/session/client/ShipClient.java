package at.fhv.session.client;

import at.fhv.session.dto.FleetShipDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Component
public class ShipClient {

    private static final Logger log = LoggerFactory.getLogger(ShipClient.class);

    private final RestTemplate restTemplate;
    private final String shipServiceUrl;

    public ShipClient(RestTemplate restTemplate,
                      @Value("${services.ship.url}") String shipServiceUrl) {
        this.restTemplate = restTemplate;
        this.shipServiceUrl = shipServiceUrl;
    }

    public void deleteAllShipsOfPlayer(String playerId) {
        try {
            restTemplate.delete(shipServiceUrl + "/api/ships/player/" + playerId);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while cleaning up ships for player {}: {}",
                    playerId, ex.getMessage());
        }
    }

    public void deleteAllShipsOfSession(String sessionId) {
        try {
            restTemplate.delete(shipServiceUrl + "/api/ships/session/" + sessionId);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while cleaning up ships for session {}: {}",
                    sessionId, ex.getMessage());
        }
    }

    public List<String> getPlayerShipIds(String playerId) {
        try {
            FleetShipDTO[] ships = restTemplate.getForObject(
                    shipServiceUrl + "/api/ships/fleet/" + playerId,
                    FleetShipDTO[].class);
            if (ships == null) return List.of();
            return Arrays.stream(ships)
                    .map(FleetShipDTO::getId)
                    .toList();
        } catch (Exception ex) {
            log.warn("ship-service unavailable while fetching ship IDs for player {}: {}",
                    playerId, ex.getMessage());
            return List.of();
        }
    }

    public void startMinigame(String shipId) {
        try {
            restTemplate.postForObject(shipServiceUrl + "/api/ships/" + shipId + "/minigame/start", null, Void.class);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while starting minigame for ship {}: {}",
                    shipId, ex.getMessage());
        }
    }

    public void finishMinigame(String shipId) {
        try {
            restTemplate.postForObject(shipServiceUrl + "/api/ships/" + shipId + "/minigame/finish", null, Void.class);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while finishing minigame for ship {}: {}",
                    shipId, ex.getMessage());
        }
    }
}
