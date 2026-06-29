package at.fhv.freight.customs.controller;

import at.fhv.freight.dto.BribeRequestDTO;
import at.fhv.freight.dto.CustomsStatusDTO;
import at.fhv.freight.customs.service.CustomsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customs")
public class CustomsController {

    private final CustomsService customsService;

    public CustomsController(CustomsService customsService) {
        this.customsService = customsService;
    }

    @PostMapping("/{shipId}/submit")
    public ResponseEntity<CustomsStatusDTO> submitToInspection(
            @PathVariable String shipId,
            @RequestParam String playerId) {
        return ResponseEntity.ok(customsService.submitToInspection(shipId, playerId));
    }

    @PostMapping("/{shipId}/bribe")
    public ResponseEntity<CustomsStatusDTO> offerBribe(
            @PathVariable String shipId,
            @RequestBody BribeRequestDTO request) {
        return ResponseEntity.ok(customsService.offerBribe(shipId, request.getPlayerId(), request.getAmount()));
    }

    @GetMapping("/{shipId}/status")
    public ResponseEntity<CustomsStatusDTO> getStatus(@PathVariable String shipId) {
        return ResponseEntity.ok(customsService.getStatus(shipId));
    }
}