package at.fhv.freight.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

// Fire-and-forget — news must never break cargo/customs processing.
@Component
public class SessionNewsClient {

    private static final Logger log = LoggerFactory.getLogger(SessionNewsClient.class);

    private final RestTemplate restTemplate;
    private final String sessionServiceUrl;

    public SessionNewsClient(RestTemplate restTemplate,
                             @Value("${services.session.url}") String sessionServiceUrl) {
        this.restTemplate = restTemplate;
        this.sessionServiceUrl = sessionServiceUrl;
    }

    public void postNews(String sessionId, Integer tick, String headline, String body,
                         String category, List<String> relatedPortIds) {
        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("tick", tick);
            payload.put("headline", headline);
            payload.put("body", body);
            payload.put("category", category);
            payload.put("relatedPortIds", relatedPortIds);
            restTemplate.postForObject(
                    sessionServiceUrl + "/internal/sessions/" + sessionId + "/news",
                    payload, Void.class);
        } catch (Exception ex) {
            log.warn("Could not post {} news to session {}: {}", category, sessionId, ex.getMessage());
        }
    }
}
