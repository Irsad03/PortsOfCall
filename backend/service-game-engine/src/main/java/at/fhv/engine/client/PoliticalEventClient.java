package at.fhv.engine.client;

import at.fhv.engine.dto.PoliticalEventDTO;
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
public class PoliticalEventClient {

    private static final Logger log = LoggerFactory.getLogger(PoliticalEventClient.class);

    private final RestTemplate restTemplate;
    private final String navigationServiceUrl;

    public PoliticalEventClient(RestTemplate restTemplate,
                                @Value("${services.route.url}") String navigationServiceUrl) {
        this.restTemplate = restTemplate;
        this.navigationServiceUrl = navigationServiceUrl;
    }

    public List<PoliticalEventDTO> processTick() {
        try {
            String url = navigationServiceUrl + "/api/political-events/tick";
            ResponseEntity<List<PoliticalEventDTO>> resp = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    null,
                    new ParameterizedTypeReference<List<PoliticalEventDTO>>() {}
            );
            return resp.getBody() != null ? resp.getBody() : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("political-events tick failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
}
