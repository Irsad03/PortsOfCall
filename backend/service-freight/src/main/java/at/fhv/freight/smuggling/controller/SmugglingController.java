package at.fhv.freight.smuggling.controller;

import at.fhv.freight.dto.StartRouteResponseDTO;
import at.fhv.freight.ship.service.ShipService;
import at.fhv.freight.smuggling.service.SmugglingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ships/{shipId}/smuggling")
public class SmugglingController {

    private final SmugglingService smugglingService;
    private final ShipService shipService;

    public SmugglingController(SmugglingService smugglingService, ShipService shipService) {
        this.smugglingService = smugglingService;
        this.shipService = shipService;
    }

    @PostMapping("/accept")
    public ResponseEntity<StartRouteResponseDTO> accept(
            @PathVariable String shipId,
            @RequestParam String playerId) {
        smugglingService.acceptOffer(shipId, playerId);
        return ResponseEntity.ok(shipService.resumeRouteAfterSmugglingDecision(shipId, playerId));
    }

    @PostMapping("/reject")
    public ResponseEntity<StartRouteResponseDTO> reject(
            @PathVariable String shipId,
            @RequestParam String playerId) {
        smugglingService.rejectOffer(shipId, playerId);
        return ResponseEntity.ok(shipService.resumeRouteAfterSmugglingDecision(shipId, playerId));
    }
}
