package at.fhv.engine.client;

import at.fhv.engine.dto.CloseOnArrivalResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class CargoClient {

    private static final Logger log = LoggerFactory.getLogger(CargoClient.class);

    private final RestTemplate restTemplate;
    private final String cargoServiceUrl;

    public CargoClient(RestTemplate restTemplate,
                       @Value("${services.cargo.url}") String cargoServiceUrl) {
        this.restTemplate = restTemplate;
        this.cargoServiceUrl = cargoServiceUrl;
    }

    public void refillContracts(String sessionId, int currentTick) {
        try {
            restTemplate.postForLocation(
                    cargoServiceUrl + "/api/cargo/refill?sessionId=" + sessionId
                            + "&tick=" + currentTick, null);
        } catch (Exception ex) {
            log.warn("cargo-service unavailable while refilling contracts (session {}, tick {}): {}",
                    sessionId, currentTick, ex.getMessage());
        }
    }

    public void expireOpenContracts(String sessionId, int currentTick) {
        try {
            restTemplate.postForLocation(
                    cargoServiceUrl + "/api/cargo/expire?sessionId=" + sessionId
                            + "&currentTick=" + currentTick, null);
        } catch (Exception ex) {
            log.warn("cargo-service unavailable while expiring contracts (session {}, tick {}): {}",
                    sessionId, currentTick, ex.getMessage());
        }
    }

    public CloseOnArrivalResponseDTO closeOnArrival(String shipId, String portId, int currentTick) {
        try {
            return restTemplate.postForObject(
                    cargoServiceUrl + "/api/cargo/ship/" + shipId
                            + "/close-on-arrival?portId=" + portId
                            + "&currentTick=" + currentTick,
                    null, CloseOnArrivalResponseDTO.class);
        } catch (Exception ex) {
            log.warn("cargo-service unavailable while closing-on-arrival ship {} at {}: {}",
                    shipId, portId, ex.getMessage());
            return new CloseOnArrivalResponseDTO(0, 0);
        }
    }
}
