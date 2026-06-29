package at.fhv.freight.ship.controller;

import at.fhv.freight.dto.BuyShipRequestDTO;
import at.fhv.freight.dto.CreateShipRequestDTO;
import at.fhv.freight.dto.FleetShipDTO;
import at.fhv.freight.dto.HirePilotResponseDTO;
import at.fhv.freight.dto.MarketShipDTO;
import at.fhv.freight.dto.NavigateSelfResponseDTO;
import at.fhv.freight.dto.OverboardResultRequestDTO;
import at.fhv.freight.dto.OverboardResultResponseDTO;
import at.fhv.freight.dto.ParkingResultRequestDTO;
import at.fhv.freight.dto.ParkingResultResponseDTO;
import at.fhv.freight.dto.RatsResultRequestDTO;
import at.fhv.freight.dto.RatsResultResponseDTO;
import at.fhv.freight.dto.RefuelResponseDTO;
import at.fhv.freight.dto.RepairResponseDTO;
import at.fhv.freight.dto.SellShipRequestDTO;
import at.fhv.freight.dto.SellShipResponseDTO;
import at.fhv.freight.dto.SessionTickResultDTO;
import at.fhv.freight.dto.ShipActionRequestDTO;
import at.fhv.freight.dto.StartRouteRequestDTO;
import at.fhv.freight.dto.StartRouteResponseDTO;
import at.fhv.freight.ship.service.ShipService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ships")
public class ShipController {

    private final ShipService shipService;

    public ShipController(ShipService shipService) {
        this.shipService = shipService;
    }

    @GetMapping("/market")
    public ResponseEntity<List<MarketShipDTO>> getMarketShips() {
        return ResponseEntity.ok(shipService.getMarketShips());
    }

    @PostMapping("/market")
    public ResponseEntity<MarketShipDTO> addMarketShip(@RequestBody CreateShipRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shipService.addMarketShip(request));
    }

    @PostMapping("/buy")
    public ResponseEntity<Void> buyShip(@RequestBody BuyShipRequestDTO request) {
        shipService.buyShip(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{shipId}/sell")
    public ResponseEntity<SellShipResponseDTO> sellShip(@PathVariable String shipId,
                                                        @RequestBody SellShipRequestDTO request) {
        return ResponseEntity.ok(shipService.sellShip(request.getPlayerId(), shipId));
    }

    @GetMapping("/fleet/{playerId}")
    public ResponseEntity<List<FleetShipDTO>> getPlayerFleet(@PathVariable String playerId) {
        return ResponseEntity.ok(shipService.getPlayerFleet(playerId));
    }

    @GetMapping("/at-port")
    public ResponseEntity<List<FleetShipDTO>> getShipsAtPort(@RequestParam String portId,
                                                             @RequestParam String playerId) {
        return ResponseEntity.ok(shipService.getShipsAtPort(portId, playerId));
    }

    @GetMapping("/{shipId}")
    public ResponseEntity<FleetShipDTO> getShip(@PathVariable String shipId) {
        return ResponseEntity.ok(shipService.getShip(shipId));
    }

    @DeleteMapping("/player/{playerId}")
    public ResponseEntity<Void> deleteAllShipsOfPlayer(@PathVariable String playerId) {
        shipService.deleteAllShipsOfPlayer(playerId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<Void> deleteAllShipsOfSession(@PathVariable String sessionId) {
        shipService.deleteAllShipsOfSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refuel")
    public ResponseEntity<RefuelResponseDTO> refuelShip(@RequestBody ShipActionRequestDTO request) {
        return ResponseEntity.ok(shipService.refuelShip(request.getPlayerId(), request.getShipId()));
    }

    @PostMapping("/repair")
    public ResponseEntity<RepairResponseDTO> repairShip(@RequestBody ShipActionRequestDTO request) {
        return ResponseEntity.ok(shipService.repairShip(request.getPlayerId(), request.getShipId()));
    }

    @PostMapping("/hire-pilot")
    public ResponseEntity<HirePilotResponseDTO> hirePilot(@RequestBody ShipActionRequestDTO request) {
        return ResponseEntity.ok(shipService.hirePilot(request.getPlayerId(), request.getShipId()));
    }

    @PostMapping("/navigate-self")
    public ResponseEntity<NavigateSelfResponseDTO> navigateSelf(@RequestBody ShipActionRequestDTO request) {
        return ResponseEntity.ok(shipService.navigateSelf(request.getPlayerId(), request.getShipId()));
    }

    @PostMapping("/parking-result")
    public ResponseEntity<ParkingResultResponseDTO> submitParkingResult(@RequestBody ParkingResultRequestDTO request) {
        return ResponseEntity.ok(shipService.submitParkingResult(request));
    }

    @PostMapping("/navigate")
    public ResponseEntity<StartRouteResponseDTO> startRoute(@RequestBody StartRouteRequestDTO request) {
        return ResponseEntity.ok(shipService.startRoute(request));
    }

    @PostMapping("/{shipId}/minigame/start")
    public ResponseEntity<Void> startMinigame(@PathVariable String shipId) {
        shipService.startMinigame(shipId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{shipId}/minigame/finish")
    public ResponseEntity<Void> finishMinigame(@PathVariable String shipId) {
        shipService.finishMinigame(shipId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{shipId}/minigame/rats/finish")
    public ResponseEntity<RatsResultResponseDTO> finishRatsMinigame(
            @PathVariable String shipId,
            @RequestBody RatsResultRequestDTO request) {
        return ResponseEntity.ok(shipService.finishRatsMinigame(shipId, request));
    }

    @PostMapping("/{shipId}/minigame/overboard/finish")
    public ResponseEntity<OverboardResultResponseDTO> finishOverboardMinigame(
            @PathVariable String shipId,
            @RequestBody OverboardResultRequestDTO request) {
        return ResponseEntity.ok(shipService.finishOverboardMinigame(shipId, request));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<FleetShipDTO>> getAllShipsOfSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(shipService.getAllShipsOfSession(sessionId));
    }

    @PostMapping("/session/{sessionId}/process-tick")
    public ResponseEntity<SessionTickResultDTO> processTickForSession(
            @PathVariable String sessionId, @RequestParam("currentTick") int currentTick) {
        return ResponseEntity.ok(shipService.processTickForSession(sessionId, currentTick));
    }
}
