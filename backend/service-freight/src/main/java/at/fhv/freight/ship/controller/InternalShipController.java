package at.fhv.freight.ship.controller;

import at.fhv.freight.dto.FleetShipDTO;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.ship.service.ShipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/ships")
public class InternalShipController {

    private final ShipService shipService;

    public InternalShipController(ShipService shipService) {
        this.shipService = shipService;
    }

    @PutMapping("/{shipId}/status")
    public ResponseEntity<FleetShipDTO> updateStatus(@PathVariable String shipId,
                                                     @RequestParam ShipStatus status) {
        return ResponseEntity.ok(shipService.updateStatus(shipId, status));
    }

    @PutMapping("/{shipId}/move")
    public ResponseEntity<Void> moveShip(@PathVariable String shipId,
                                         @RequestParam String newPortId) {
        shipService.moveShip(shipId, newPortId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{shipId}/mortgaged")
    public ResponseEntity<FleetShipDTO> setMortgaged(@PathVariable String shipId,
                                                     @RequestParam boolean value) {
        return ResponseEntity.ok(shipService.setMortgaged(shipId, value));
    }

    @PostMapping("/{shipId}/seize")
    public ResponseEntity<FleetShipDTO> seize(@PathVariable String shipId) {
        return ResponseEntity.ok(shipService.seizeShip(shipId));
    }
}
