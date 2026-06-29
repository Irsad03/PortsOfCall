package at.fhv.engine.client;

import at.fhv.engine.dto.FleetShipDTO;
import at.fhv.engine.dto.SessionTickResultDTO;
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

    public List<FleetShipDTO> getAllShipsOfSession(String sessionId) {
        try {
            FleetShipDTO[] arr = restTemplate.getForObject(
                    shipServiceUrl + "/api/ships/session/" + sessionId, FleetShipDTO[].class);
            return arr == null ? List.of() : Arrays.asList(arr);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while fetching ships for session {}: {}",
                    sessionId, ex.getMessage());
            return List.of();
        }
    }

    public List<FleetShipDTO> getPlayerFleet(String playerId) {
        try {
            FleetShipDTO[] arr = restTemplate.getForObject(
                    shipServiceUrl + "/api/ships/fleet/" + playerId, FleetShipDTO[].class);
            return arr == null ? List.of() : Arrays.asList(arr);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while fetching fleet for {}: {}",
                    playerId, ex.getMessage());
            return List.of();
        }
    }

    public SessionTickResultDTO processTickForSession(String sessionId, int currentTick) {
        try {
            return restTemplate.postForObject(
                    shipServiceUrl + "/api/ships/session/" + sessionId
                            + "/process-tick?currentTick=" + currentTick,
                    null, SessionTickResultDTO.class);
        } catch (Exception ex) {
            log.warn("ship-service unavailable while processing tick for session {}: {}",
                    sessionId, ex.getMessage());
            return new SessionTickResultDTO(List.of(), List.of(), List.of(), List.of());
        }
    }
}