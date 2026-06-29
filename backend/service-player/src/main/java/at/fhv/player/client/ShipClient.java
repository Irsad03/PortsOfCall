package at.fhv.player.client;

import at.fhv.player.dto.ShipDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@Component
public class ShipClient {

    private static final Logger log = LoggerFactory.getLogger(ShipClient.class);

    private final RestTemplate restTemplate;
    private final String freightServiceUrl;

    public ShipClient(RestTemplate restTemplate,
                      @Value("${services.freight.url}") String freightServiceUrl) {
        this.restTemplate = restTemplate;
        this.freightServiceUrl = freightServiceUrl;
    }

    public ShipDTO getShip(String shipId) {
        try {
            return restTemplate.getForObject(
                    freightServiceUrl + "/api/ships/" + shipId, ShipDTO.class);
        } catch (HttpClientErrorException.NotFound nf) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ship not found: " + shipId);
        } catch (Exception ex) {
            log.warn("freight-service unavailable while fetching ship {}: {}", shipId, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not reach the ship registry. Please try again.");
        }
    }

    public List<ShipDTO> getFleet(String playerId) {
        try {
            ShipDTO[] fleet = restTemplate.getForObject(
                    freightServiceUrl + "/api/ships/fleet/" + playerId, ShipDTO[].class);
            return fleet == null ? List.of() : Arrays.asList(fleet);
        } catch (Exception ex) {
            log.warn("freight-service unavailable while fetching fleet of {}: {}", playerId, ex.getMessage());
            return List.of();
        }
    }

    public void setMortgaged(String shipId, boolean mortgaged) {
        try {
            restTemplate.put(
                    freightServiceUrl + "/internal/ships/" + shipId + "/mortgaged?value=" + mortgaged,
                    null);
        } catch (Exception ex) {
            log.warn("freight-service unavailable while setting mortgage marker on ship {}: {}",
                    shipId, ex.getMessage());
        }
    }

    public void seizeShip(String shipId) {
        try {
            restTemplate.postForObject(
                    freightServiceUrl + "/internal/ships/" + shipId + "/seize", null, Void.class);
        } catch (Exception ex) {
            log.warn("freight-service unavailable while seizing ship {}: {}", shipId, ex.getMessage());
        }
    }
}