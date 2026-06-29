package at.fhv.freight.client;

import at.fhv.freight.dto.RouteDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RouteClient {

    private final RestTemplate restTemplate;
    private final String routeServiceUrl;

    public RouteClient(RestTemplate restTemplate,
                       @Value("${services.route.url}") String routeServiceUrl) {
        this.restTemplate = restTemplate;
        this.routeServiceUrl = routeServiceUrl;
    }

    public RouteDTO findRoute(String fromPortId, String toPortId) {
        try {
            return restTemplate.getForObject(
                    routeServiceUrl + "/api/routes/find?from=" + fromPortId + "&to=" + toPortId,
                    RouteDTO.class);
        } catch (HttpClientErrorException.NotFound nf) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No route from " + fromPortId + " to " + toPortId);
        }
    }
}
