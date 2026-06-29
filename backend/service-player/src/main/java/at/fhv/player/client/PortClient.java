package at.fhv.player.client;

import at.fhv.player.dto.PortDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Component
public class PortClient {

    private static final Logger log = LoggerFactory.getLogger(PortClient.class);

    private final RestTemplate restTemplate;
    private final String portServiceUrl;

    public PortClient(RestTemplate restTemplate,
                      @Value("${services.port.url}") String portServiceUrl) {
        this.restTemplate = restTemplate;
        this.portServiceUrl = portServiceUrl;
    }

    public boolean exists(String portId) {
        try {
            PortDTO port = restTemplate.getForObject(
                    portServiceUrl + "/api/ports/" + portId, PortDTO.class);
            return port != null;
        } catch (HttpClientErrorException.NotFound notFound) {
            return false;
        } catch (Exception ex) {
            log.warn("port-service unavailable while validating port {} – assuming valid: {}",
                    portId, ex.getMessage());
            return true;
        }
    }
}