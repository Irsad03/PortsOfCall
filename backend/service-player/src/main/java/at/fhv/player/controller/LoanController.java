package at.fhv.player.controller;

import at.fhv.player.dto.LoanApplicationResponseDTO;
import at.fhv.player.dto.LoanDTO;
import at.fhv.player.dto.LoanQuoteDTO;
import at.fhv.player.dto.LoanRequestDTO;
import at.fhv.player.dto.LoanTransactionDTO;
import at.fhv.player.model.LoanStatus;
import at.fhv.player.service.LoanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    // Application & listing

    @PostMapping("/api/players/{playerId}/loans")
    public ResponseEntity<LoanApplicationResponseDTO> apply(
            @PathVariable String playerId,
            @RequestParam(defaultValue = "0") int currentTick,
            @RequestBody LoanRequestDTO request) {
        return ResponseEntity.ok(
                loanService.applyForLoan(playerId, request.getAmount(), request.getTermTicks(), currentTick));
    }

    @PostMapping("/api/players/{playerId}/loans/quote")
    public ResponseEntity<LoanQuoteDTO> quote(
            @PathVariable String playerId,
            @RequestBody LoanRequestDTO request) {
        return ResponseEntity.ok(
                loanService.quoteLoan(playerId, request.getAmount(), request.getTermTicks()));
    }

    @GetMapping("/api/players/{playerId}/loans")
    public ResponseEntity<List<LoanDTO>> list(
            @PathVariable String playerId,
            @RequestParam(required = false) LoanStatus status) {
        return ResponseEntity.ok(loanService.getLoans(playerId, status));
    }

    @GetMapping("/api/loans/{loanId}/history")
    public ResponseEntity<List<LoanTransactionDTO>> history(@PathVariable String loanId) {
        return ResponseEntity.ok(loanService.getLoanHistory(loanId));
    }

    // Repayment

    @PostMapping("/api/loans/{loanId}/pay")
    public ResponseEntity<LoanDTO> pay(
            @PathVariable String loanId,
            @RequestParam(defaultValue = "0") int currentTick) {
        return ResponseEntity.ok(loanService.payInstallment(loanId, currentTick));
    }

    @PostMapping("/api/loans/{loanId}/payoff")
    public ResponseEntity<LoanDTO> payoff(
            @PathVariable String loanId,
            @RequestParam(defaultValue = "0") int currentTick) {
        return ResponseEntity.ok(loanService.payOff(loanId, currentTick));
    }

    // Per-tick auto-debit (called by the game engine)

    @PostMapping("/api/loans/process-tick")
    public ResponseEntity<Void> processTick(
            @RequestParam String sessionId,
            @RequestParam int currentTick) {
        loanService.processTickForSession(sessionId, currentTick);
        return ResponseEntity.ok().build();
    }
}