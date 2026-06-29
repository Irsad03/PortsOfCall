package at.fhv.engine.client;

import at.fhv.engine.dto.CreateNewsRequestDTO;
import at.fhv.engine.dto.SessionResponseDTO;
import at.fhv.engine.dto.TickMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Component
public class SessionClient {

    private static final Logger log = LoggerFactory.getLogger(SessionClient.class);

    private final RestTemplate restTemplate;
    private final String sessionServiceUrl;

    public SessionClient(RestTemplate restTemplate,
                         @Value("${services.session.url}") String sessionServiceUrl) {
        this.restTemplate = restTemplate;
        this.sessionServiceUrl = sessionServiceUrl;
    }

    public List<SessionResponseDTO> getActiveSessions() {
        try {
            SessionResponseDTO[] arr = restTemplate.getForObject(
                    sessionServiceUrl + "/api/sessions/active", SessionResponseDTO[].class);
            return arr == null ? List.of() : Arrays.asList(arr);
        } catch (Exception ex) {
            log.warn("session-service unavailable while fetching active sessions: {}", ex.getMessage());
            return List.of();
        }
    }

    public void purgeIfEmpty(String sessionId) {
        try {
            restTemplate.postForObject(
                    sessionServiceUrl + "/api/sessions/" + sessionId + "/purge-if-empty",
                    null, Void.class);
        } catch (Exception ex) {
            log.warn("Could not purge empty session {}: {}", sessionId, ex.getMessage());
        }
    }

    // Push a newspaper article into the session's news feed. Fire-and-forget:
    // a missing article must never break tick processing
    public void postNews(String sessionId, CreateNewsRequestDTO news) {
        try {
            restTemplate.postForObject(
                    sessionServiceUrl + "/internal/sessions/" + sessionId + "/news",
                    news, Void.class);
        } catch (Exception ex) {
            log.warn("Could not post news to session {}: {}", sessionId, ex.getMessage());
        }
    }

    // Increment tick on the session and return the new tick value (or -1 on failure)
    public int incrementTick(String sessionId) {
        try {
            TickMessageDTO response = restTemplate.postForObject(
                    sessionServiceUrl + "/api/sessions/" + sessionId + "/tick",
                    null, TickMessageDTO.class);
            return response != null ? response.getCurrentTick() : -1;
        } catch (Exception ex) {
            log.warn("session-service unavailable while incrementing tick for {}: {}",
                    sessionId, ex.getMessage());
            return -1;
        }
    }
}
