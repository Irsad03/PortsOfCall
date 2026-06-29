package at.fhv.session.controller;

import at.fhv.session.dto.CreateSessionRequestDTO;
import at.fhv.session.dto.JoinSessionRequestDTO;
import at.fhv.session.dto.LobbyPlayerDTO;
import at.fhv.session.dto.SessionResponseDTO;
import at.fhv.session.dto.StartEndGameVoteRequestDTO;
import at.fhv.session.dto.TickMessageDTO;
import at.fhv.session.dto.VoteEndGameRequestDTO;
import at.fhv.session.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionResponseDTO> createSession(@RequestBody CreateSessionRequestDTO request) {
        return ResponseEntity.ok(sessionService.createSession(request));
    }

    @PostMapping("/join")
    public ResponseEntity<SessionResponseDTO> joinSession(@RequestBody JoinSessionRequestDTO request) {
        return ResponseEntity.ok(sessionService.joinSession(request));
    }

    @PostMapping("/{sessionId}/start")
    public ResponseEntity<SessionResponseDTO> startSession(@PathVariable String sessionId,
                                                           @RequestParam String playerId) {
        return ResponseEntity.ok(sessionService.startSession(sessionId, playerId));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponseDTO> getSession(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @GetMapping("/{sessionId}/players")
    public ResponseEntity<List<LobbyPlayerDTO>> getSessionPlayers(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.getSessionPlayers(sessionId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<SessionResponseDTO>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @PostMapping("/{sessionId}/start-end-game-vote")
    public ResponseEntity<Void> startEndGameVote(@PathVariable String sessionId,
                                                 @RequestBody StartEndGameVoteRequestDTO request) {
        sessionService.startEndGameVote(sessionId, request.getPlayerId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/vote-end-game")
    public ResponseEntity<Void> voteEndGame(@PathVariable String sessionId,
                                            @RequestBody VoteEndGameRequestDTO request) {
        sessionService.voteEndGame(sessionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<Void> leaveSession(@PathVariable String sessionId,
                                             @RequestParam String playerId) {
        sessionService.leaveSession(sessionId, playerId);
        return ResponseEntity.noContent().build();
    }

    // Called by game-engine-service every tick to advance the session counter
    @PostMapping("/{sessionId}/tick")
    public ResponseEntity<TickMessageDTO> incrementTick(@PathVariable String sessionId) {
        int newTick = sessionService.incrementTick(sessionId);
        return ResponseEntity.ok(new TickMessageDTO(sessionId, newTick));
    }

    @PostMapping("/{sessionId}/purge-if-empty")
    public ResponseEntity<Void> purgeIfEmpty(@PathVariable String sessionId) {
        sessionService.purgeIfEmpty(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sessionId}/minigame/start")
    public ResponseEntity<Void> startMinigame(@PathVariable String sessionId,
                                              @RequestParam String shipId) {
        sessionService.startMinigame(sessionId, shipId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{sessionId}/minigame/finish")
    public ResponseEntity<Void> finishMinigame(@PathVariable String sessionId,
                                               @RequestParam String shipId) {
        sessionService.finishMinigame(sessionId, shipId);
        return ResponseEntity.ok().build();
    }
}
