package at.fhv.engine.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;


@Component
public class LoanClient {

    private static final Logger log = LoggerFactory.getLogger(LoanClient.class);

    private final RestTemplate restTemplate;
    private final String playerServiceUrl;

    public LoanClient(RestTemplate restTemplate,
                      @Value("${services.player.url}") String playerServiceUrl) {
        this.restTemplate = restTemplate;
        this.playerServiceUrl = playerServiceUrl;
    }

    public void processTick(String sessionId, int currentTick) {
        try {
            restTemplate.postForObject(
                    playerServiceUrl + "/api/loans/process-tick?sessionId=" + sessionId
                            + "&currentTick=" + currentTick,
                    null, Void.class);
        } catch (Exception ex) {
            log.warn("player-service unavailable while processing loans for session {}: {}",
                    sessionId, ex.getMessage());
        }
    }
}
