package at.fhv.session.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;


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

    public void closeAllAcceptedContracts(String sessionId) {
        try {
            restTemplate.postForLocation(
                    cargoServiceUrl + "/api/cargo/session/" + sessionId + "/close-accepted", null);
        } catch (Exception ex) {
            log.warn("cargo-service unavailable while closing accepted contracts for session {}: {}",
                    sessionId, ex.getMessage());
        }
    }

    public void cancelContractsForShips(List<String> shipIds) {
        if (shipIds == null || shipIds.isEmpty()) return;
        try {
            restTemplate.exchange(
                    cargoServiceUrl + "/api/cargo/ships",
                    HttpMethod.DELETE,
                    new HttpEntity<>(shipIds),
                    Void.class);
        } catch (Exception ex) {
            log.warn("cargo-service unavailable while cancelling contracts for ships {}: {}",
                    shipIds, ex.getMessage());
        }
    }
}
