package at.fhv.engine.client;

import at.fhv.engine.dto.RouteDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class RouteClient {

    private static final Logger log = LoggerFactory.getLogger(RouteClient.class);

    private final RestTemplate restTemplate;
    private final String routeServiceUrl;
    private final ConcurrentMap<String, RouteDTO> cache = new ConcurrentHashMap<>();

    public RouteClient(RestTemplate restTemplate,
                       @Value("${services.route.url}") String routeServiceUrl) {
        this.restTemplate = restTemplate;
        this.routeServiceUrl = routeServiceUrl;
    }

    public RouteDTO getRoute(String routeId) {
        if (routeId == null) return null;
        RouteDTO cached = cache.get(routeId);
        if (cached != null) return cached;
        try {
            RouteDTO route = restTemplate.getForObject(
                    routeServiceUrl + "/api/routes/" + routeId, RouteDTO.class);
            if (route != null) cache.put(routeId, route);
            return route;
        } catch (Exception ex) {
            log.warn("route-service unavailable while fetching route {}: {}", routeId, ex.getMessage());
            return null;
        }
    }
}