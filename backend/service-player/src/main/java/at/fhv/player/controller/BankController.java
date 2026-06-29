package at.fhv.player.controller;

import at.fhv.player.dto.BankOverviewDTO;
import at.fhv.player.service.BankService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bank")
public class BankController {

    private final BankService bankService;

    public BankController(BankService bankService) {
        this.bankService = bankService;
    }

    @GetMapping("/{playerId}/overview")
    public ResponseEntity<BankOverviewDTO> getOverview(@PathVariable String playerId) {
        return ResponseEntity.ok(bankService.getOverview(playerId));
    }
}
