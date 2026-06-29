package at.fhv.freight.client;

import at.fhv.freight.dto.PortDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PortClient {

    private static final Logger log = LoggerFactory.getLogger(PortClient.class);

    private final RestTemplate restTemplate;
    private final String portServiceUrl;
    private final Map<String, PortDTO> cache = new ConcurrentHashMap<>();

    public PortClient(RestTemplate restTemplate,
                      @Value("${services.port.url}") String portServiceUrl) {
        this.restTemplate = restTemplate;
        this.portServiceUrl = portServiceUrl;
    }

    public List<PortDTO> getAllPorts() {
        try {
            PortDTO[] ports = restTemplate.getForObject(
                    portServiceUrl + "/api/ports", PortDTO[].class);
            if (ports != null) {
                Map<String, PortDTO> fresh = new HashMap<>();
                for (PortDTO p : ports) fresh.put(p.getId(), p);
                cache.putAll(fresh);
                cache.keySet().retainAll(fresh.keySet());
                return Arrays.asList(ports);
            }
        } catch (Exception ex) {
            log.warn("navigation-service unavailable while loading ports: {}", ex.getMessage());
        }
        return List.copyOf(cache.values());
    }

    public PortDTO getPort(String portId) {
        PortDTO cached = cache.get(portId);
        if (cached != null) return cached;
        try {
            PortDTO p = restTemplate.getForObject(
                    portServiceUrl + "/api/ports/" + portId, PortDTO.class);
            if (p != null) cache.put(portId, p);
            return p;
        } catch (Exception ex) {
            log.warn("navigation-service unavailable while fetching port {}: {}", portId, ex.getMessage());
            return null;
        }
    }

    public String getPortName(String portId) {
        PortDTO p = getPort(portId);
        return p != null ? p.getName() : "Unknown Port";
    }
}
