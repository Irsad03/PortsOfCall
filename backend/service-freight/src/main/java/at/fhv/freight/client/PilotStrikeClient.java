package at.fhv.freight.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;


@Component
public class PilotStrikeClient {

    private static final Logger log = LoggerFactory.getLogger(PilotStrikeClient.class);

    private final RestTemplate restTemplate;
    private final String navigationServiceUrl;

    public PilotStrikeClient(RestTemplate restTemplate,
                             @Value("${services.route.url}") String navigationServiceUrl) {
        this.restTemplate = restTemplate;
        this.navigationServiceUrl = navigationServiceUrl;
    }

    public List<String> getStrikingPortIds() {
        try {
            ResponseEntity<List<String>> resp = restTemplate.exchange(
                    navigationServiceUrl + "/api/political-events/pilot-strikes",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {});
            return resp.getBody() != null ? resp.getBody() : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("pilot-strikes lookup failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public boolean isStriking(String portId) {
        return portId != null && getStrikingPortIds().contains(portId);
    }
}
