package at.fhv.player.controller;

import at.fhv.player.dto.MortgageApplicationResponseDTO;
import at.fhv.player.dto.MortgageDTO;
import at.fhv.player.dto.MortgageOptionDTO;
import at.fhv.player.dto.MortgageQuoteDTO;
import at.fhv.player.dto.MortgageRequestDTO;
import at.fhv.player.dto.MortgageTransactionDTO;
import at.fhv.player.model.MortgageStatus;
import at.fhv.player.service.MortgageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MortgageController {

    private final MortgageService mortgageService;

    public MortgageController(MortgageService mortgageService) {
        this.mortgageService = mortgageService;
    }

    // Options, application & listing
    @GetMapping("/api/players/{playerId}/mortgage-options")
    public ResponseEntity<List<MortgageOptionDTO>> options(@PathVariable String playerId) {
        return ResponseEntity.ok(mortgageService.getMortgageOptions(playerId));
    }

    @PostMapping("/api/players/{playerId}/mortgages/quote")
    public ResponseEntity<MortgageQuoteDTO> quote(
            @PathVariable String playerId,
            @RequestBody MortgageRequestDTO request) {
        return ResponseEntity.ok(
                mortgageService.quoteMortgage(playerId, request.getShipId(),
                        request.getAmount(), request.getTermTicks()));
    }

    @PostMapping("/api/players/{playerId}/mortgages")
    public ResponseEntity<MortgageApplicationResponseDTO> apply(
            @PathVariable String playerId,
            @RequestParam(defaultValue = "0") int currentTick,
            @RequestBody MortgageRequestDTO request) {
        return ResponseEntity.ok(
                mortgageService.applyForMortgage(playerId, request.getShipId(),
                        request.getAmount(), request.getTermTicks(), currentTick));
    }

    @GetMapping("/api/players/{playerId}/mortgages")
    public ResponseEntity<List<MortgageDTO>> list(
            @PathVariable String playerId,
            @RequestParam(required = false) MortgageStatus status) {
        return ResponseEntity.ok(mortgageService.getMortgages(playerId, status));
    }

    @GetMapping("/api/mortgages/{mortgageId}/history")
    public ResponseEntity<List<MortgageTransactionDTO>> history(@PathVariable String mortgageId) {
        return ResponseEntity.ok(mortgageService.getMortgageHistory(mortgageId));
    }

    // Repayment

    @PostMapping("/api/mortgages/{mortgageId}/pay")
    public ResponseEntity<MortgageDTO> pay(
            @PathVariable String mortgageId,
            @RequestParam(defaultValue = "0") int currentTick) {
        return ResponseEntity.ok(mortgageService.payInstallment(mortgageId, currentTick));
    }

    @PostMapping("/api/mortgages/{mortgageId}/payoff")
    public ResponseEntity<MortgageDTO> payoff(
            @PathVariable String mortgageId,
            @RequestParam(defaultValue = "0") int currentTick) {
        return ResponseEntity.ok(mortgageService.payOff(mortgageId, currentTick));
    }

    // Per-tick auto-debit (called by the game engine)

    @PostMapping("/api/mortgages/process-tick")
    public ResponseEntity<Void> processTick(
            @RequestParam String sessionId,
            @RequestParam int currentTick) {
        mortgageService.processTickForSession(sessionId, currentTick);
        return ResponseEntity.ok().build();
    }
}