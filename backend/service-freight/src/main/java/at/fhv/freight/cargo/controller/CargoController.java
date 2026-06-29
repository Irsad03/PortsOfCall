package at.fhv.freight.cargo.controller;

import at.fhv.freight.dto.AcceptCargoRequestDTO;
import at.fhv.freight.dto.CargoContractDTO;
import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.CloseOnArrivalResponseDTO;
import at.fhv.freight.dto.ForfeitContractRequestDTO;
import at.fhv.freight.dto.ForfeitContractResponseDTO;
import at.fhv.freight.dto.UnloadCargoRequestDTO;
import at.fhv.freight.dto.UnloadCargoResponseDTO;
import at.fhv.freight.cargo.service.CargoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cargo")
public class CargoController {

    private final CargoService cargoService;

    public CargoController(CargoService cargoService) {
        this.cargoService = cargoService;
    }

    @GetMapping("/market")
    public ResponseEntity<List<CargoContractDTO>> getMarketContractsForPort(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("portId") String portId,
            @RequestParam("currentTick") int currentTick) {
        return ResponseEntity.ok(cargoService.getContractsForPort(sessionId, portId, currentTick));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CargoContractDTO>> getAllOpenContracts(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("currentTick") int currentTick) {
        return ResponseEntity.ok(cargoService.getAllOpenContracts(sessionId, currentTick));
    }

    @GetMapping("/ship/{shipId}")
    public ResponseEntity<List<CargoContractDTO>> getContractsForShip(
            @PathVariable String shipId,
            @RequestParam("status") CargoStatus status) {
        return ResponseEntity.ok(cargoService.getContractsForShip(shipId, status));
    }

    @PostMapping("/accept")
    public ResponseEntity<Void> acceptContract(@RequestBody AcceptCargoRequestDTO request) {
        cargoService.acceptContract(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unload")
    public ResponseEntity<UnloadCargoResponseDTO> unloadCargo(@RequestBody UnloadCargoRequestDTO request) {
        return ResponseEntity.ok(cargoService.unloadCargo(request));
    }

    @PostMapping("/forfeit")
    public ResponseEntity<ForfeitContractResponseDTO> forfeitContract(@RequestBody ForfeitContractRequestDTO request) {
        return ResponseEntity.ok(cargoService.forfeitContract(request));
    }

    @PostMapping("/refill")
    public ResponseEntity<Void> refillContracts(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("tick") int tick) {
        cargoService.refillContracts(sessionId, tick);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/session/{sessionId}/close-accepted")
    public ResponseEntity<Void> closeAllAcceptedContracts(@PathVariable String sessionId) {
        cargoService.closeAllAcceptedContracts(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/expire")
    public ResponseEntity<Void> expireOpenContracts(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("currentTick") int currentTick) {
        cargoService.deleteExpiredOpenContracts(sessionId, currentTick);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{contractId}/status")
    public ResponseEntity<CargoContractDTO> updateStatus(
            @PathVariable String contractId,
            @RequestParam("status") CargoStatus status) {
        return ResponseEntity.ok(cargoService.updateStatus(contractId, status));
    }

    @PostMapping("/ship/{shipId}/close-on-arrival")
    public ResponseEntity<CloseOnArrivalResponseDTO> closeOnArrival(
            @PathVariable String shipId,
            @RequestParam("portId") String portId,
            @RequestParam("currentTick") int currentTick) {
        return ResponseEntity.ok(cargoService.closeOnArrival(shipId, portId, currentTick));
    }

    @DeleteMapping("/ships")
    public ResponseEntity<Void> cancelContractsForShips(@RequestBody List<String> shipIds) {
        cargoService.cancelContractsForShips(shipIds);
        return ResponseEntity.noContent().build();
    }
}
