package at.fhv.player.controller;

import at.fhv.player.dto.CreatePlayerRequestDTO;
import at.fhv.player.dto.LeaderboardEntryDTO;
import at.fhv.player.dto.PlayerDTO;
import at.fhv.player.dto.SelectHomePortRequestDTO;
import at.fhv.player.dto.UpdateCurrentPortRequestDTO;
import at.fhv.player.dto.UpdateCurrentShipRequestDTO;
import at.fhv.player.dto.UpdateMoneyRequestDTO;
import at.fhv.player.dto.UpdatePositionRequestDTO;
import at.fhv.player.dto.UpdateSessionRequestDTO;
import at.fhv.player.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @PostMapping
    public ResponseEntity<PlayerDTO> createPlayer(@RequestBody CreatePlayerRequestDTO request) {
        return ResponseEntity.ok(playerService.createPlayer(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerDTO> getPlayer(@PathVariable String id) {
        return ResponseEntity.ok(playerService.findById(id));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<PlayerDTO>> getPlayersBySession(@PathVariable String sessionId) {
        return ResponseEntity.ok(playerService.findBySession(sessionId));
    }

    @GetMapping("/session/{sessionId}/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(@PathVariable String sessionId) {
        return ResponseEntity.ok(playerService.getLeaderboard(sessionId));
    }

    @PutMapping("/{id}/money")
    public ResponseEntity<PlayerDTO> updateMoney(@PathVariable String id,
                                                 @RequestBody UpdateMoneyRequestDTO request) {
        return ResponseEntity.ok(
                playerService.updateMoney(id, request.getDelta(), request.isClampAtZero()));
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<PlayerDTO> updatePosition(@PathVariable String id,
                                                    @RequestBody UpdatePositionRequestDTO request) {
        return ResponseEntity.ok(playerService.updatePosition(id, request.getX(), request.getY()));
    }

    @PutMapping("/{id}/home-port")
    public ResponseEntity<PlayerDTO> selectHomePort(@PathVariable String id,
                                                    @RequestBody SelectHomePortRequestDTO request) {
        return ResponseEntity.ok(playerService.selectHomePort(id, request.getPortId()));
    }

    @PutMapping("/{id}/current-port")
    public ResponseEntity<PlayerDTO> updateCurrentPort(@PathVariable String id,
                                                       @RequestBody UpdateCurrentPortRequestDTO request) {
        return ResponseEntity.ok(playerService.updateCurrentPort(id, request.getPortId()));
    }

    @PutMapping("/{id}/current-ship")
    public ResponseEntity<PlayerDTO> updateCurrentShip(@PathVariable String id,
                                                       @RequestBody UpdateCurrentShipRequestDTO request) {
        return ResponseEntity.ok(playerService.updateCurrentShip(id, request.getShipId()));
    }

    @PutMapping("/{id}/session")
    public ResponseEntity<PlayerDTO> updateSession(@PathVariable String id,
                                                   @RequestBody UpdateSessionRequestDTO request) {
        return ResponseEntity.ok(playerService.updateSession(id, request.getSessionId()));
    }
}