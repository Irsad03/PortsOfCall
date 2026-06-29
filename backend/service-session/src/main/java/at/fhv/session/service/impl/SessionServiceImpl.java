package at.fhv.session.service.impl;

import at.fhv.session.dto.CreateSessionRequestDTO;
import at.fhv.session.dto.JoinSessionRequestDTO;
import at.fhv.session.dto.LeaderboardEntryDTO;
import at.fhv.session.dto.LobbyPlayerDTO;
import at.fhv.session.dto.SessionResponseDTO;
import at.fhv.session.dto.SessionStatus;
import at.fhv.session.dto.VoteEndGameRequestDTO;
import at.fhv.session.client.CargoClient;
import at.fhv.session.client.PlayerClient;
import at.fhv.session.client.ShipClient;
import at.fhv.session.model.GameSession;
import at.fhv.session.model.SessionPlayer;
import at.fhv.session.repository.GameSessionRepository;
import at.fhv.session.repository.NewsItemRepository;
import at.fhv.session.service.SessionNotFoundException;
import at.fhv.session.service.SessionService;
import at.fhv.session.service.WebSocketBroadcaster;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;

@Service
public class SessionServiceImpl implements SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionServiceImpl.class);
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_CODE_ATTEMPTS = 100;

    private final GameSessionRepository sessionRepository;
    private final NewsItemRepository newsItemRepository;
    private final WebSocketBroadcaster broadcaster;
    private final PlayerClient playerClient;
    private final ShipClient shipClient;
    private final CargoClient cargoClient;

    public SessionServiceImpl(GameSessionRepository sessionRepository,
                              NewsItemRepository newsItemRepository,
                              WebSocketBroadcaster broadcaster,
                              PlayerClient playerClient,
                              ShipClient shipClient,
                              CargoClient cargoClient) {
        this.sessionRepository = sessionRepository;
        this.newsItemRepository = newsItemRepository;
        this.broadcaster = broadcaster;
        this.playerClient = playerClient;
        this.shipClient = shipClient;
        this.cargoClient = cargoClient;
    }

    @Override
    @Transactional
    public SessionResponseDTO createSession(CreateSessionRequestDTO request) {
        if (request.getCreatorPlayerId() == null || request.getCreatorPlayerId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "creatorPlayerId is required");
        }

        GameSession session = new GameSession();
        session.setCode(generateUniqueCode());
        session.setStatus(at.fhv.session.model.SessionStatus.LOBBY);
        session.setCreatorPlayerId(request.getCreatorPlayerId());
        session.setMaxPlayers(6);
        session.getPlayers().add(new SessionPlayer(request.getCreatorPlayerId(), request.getCreatorName()));

        GameSession saved = sessionRepository.save(session);
        return toResponse(saved, request.getCreatorPlayerId(), request.getCreatorName());
    }

    @Override
    @Transactional
    public SessionResponseDTO joinSession(JoinSessionRequestDTO request) {
        GameSession session = sessionRepository.findByCode(request.getSessionCode().toUpperCase())
                .orElseThrow(() -> new SessionNotFoundException(
                        "Session with code '" + request.getSessionCode() + "' not found"));

        if (session.getStatus() != at.fhv.session.model.SessionStatus.LOBBY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Session has already started – joining is only possible in LOBBY state");
        }

        if (session.getCurrentPlayers() >= session.getMaxPlayers()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Session is full (" + session.getMaxPlayers() + "/" + session.getMaxPlayers() + ")");
        }

        boolean alreadyJoined = session.getPlayers().stream()
                .anyMatch(p -> p.getPlayerId().equals(request.getPlayerId()));
        if (alreadyJoined) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Player already in session");
        }

        SessionPlayer player = new SessionPlayer(request.getPlayerId(), request.getPlayerName());
        session.getPlayers().add(player);
        sessionRepository.saveAndFlush(session);

        broadcaster.broadcastLobbyEvent(session.getId(), Map.of(
                "event", "PLAYER_JOINED",
                "playerId", player.getPlayerId(),
                "playerName", player.getPlayerName(),
                "currentPlayers", session.getCurrentPlayers(),
                "maxPlayers", session.getMaxPlayers()
        ));

        return toResponse(session, request.getPlayerId(), request.getPlayerName());
    }

    @Override
    @Transactional
    public SessionResponseDTO startSession(String sessionId, String playerId) {
        GameSession session = requireSession(sessionId);

        if (!session.getCreatorPlayerId().equals(playerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the session creator can start the game");
        }

        if (session.getStatus() != at.fhv.session.model.SessionStatus.LOBBY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Session is not in LOBBY state (current: " + session.getStatus() + ")");
        }

        session.setStatus(at.fhv.session.model.SessionStatus.IN_GAME);
        sessionRepository.save(session);

        broadcaster.broadcastLobbyEvent(sessionId, Map.of("event", "GAME_STARTED"));

        cargoClient.refillContracts(session.getId(), session.getCurrentTick());

        SessionPlayer creator = session.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(session.getCreatorPlayerId()))
                .findFirst()
                .orElse(session.getPlayers().get(0));

        return toResponse(session, creator.getPlayerId(), creator.getPlayerName());
    }

    @Override
    public SessionResponseDTO getSession(String sessionId) {
        GameSession session = requireSession(sessionId);
        return toResponse(session, null, null);
    }

    @Override
    public List<LobbyPlayerDTO> getSessionPlayers(String sessionId) {
        GameSession session = requireSession(sessionId);
        return session.getPlayers().stream()
                .map(p -> new LobbyPlayerDTO(p.getPlayerId(), p.getPlayerName()))
                .toList();
    }

    @Override
    public List<SessionResponseDTO> getActiveSessions() {
        return sessionRepository.findAllByStatus(at.fhv.session.model.SessionStatus.IN_GAME).stream()
                .map(s -> toResponse(s, null, null))
                .toList();
    }

    @Override
    @Transactional
    public void startEndGameVote(String sessionId, String playerId) {
        GameSession session = requireSession(sessionId);

        if (!session.getCreatorPlayerId().equals(playerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the session host can start end game vote");
        }
        if (session.getStatus() != at.fhv.session.model.SessionStatus.IN_GAME) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is not in IN_GAME state");
        }
        if (session.isEndGameVoteStarted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "End game vote already started");
        }

        Long cooldownUntil = session.getNextEndGameVoteAt();
        if (cooldownUntil != null && cooldownUntil > System.currentTimeMillis()) {
            long secondsLeft = (cooldownUntil - System.currentTimeMillis()) / 1000;
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "End game vote is cooling down for another " + secondsLeft + " seconds");
        }

        session.setEndGameVoteStarted(true);
        session.setNextEndGameVoteAt(null);
        session.getEndGameVotes().clear();
        sessionRepository.save(session);

        broadcaster.broadcastEndGameVote(sessionId, Map.of(
                "event", "END_GAME_VOTE_STARTED",
                "totalPlayers", session.getCurrentPlayers()
        ));
    }

    @Override
    @Transactional
    public void voteEndGame(String sessionId, VoteEndGameRequestDTO request) {
        GameSession session = requireSession(sessionId);

        if (!session.isEndGameVoteStarted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No end game vote in progress");
        }
        if (session.getStatus() != at.fhv.session.model.SessionStatus.IN_GAME) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is not in IN_GAME state");
        }
        boolean playerInSession = session.getPlayers().stream()
                .anyMatch(p -> p.getPlayerId().equals(request.getPlayerId()));
        if (!playerInSession) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Player not in session");
        }

        session.getEndGameVotes().put(request.getPlayerId(), request.isVote());
        sessionRepository.save(session);

        int yesVotes = (int) session.getEndGameVotes().values().stream().filter(v -> v).count();
        int totalVotes = session.getEndGameVotes().size();
        int totalPlayers = session.getCurrentPlayers();

        broadcaster.broadcastEndGameVote(sessionId, Map.of(
                "event", "END_GAME_VOTE_UPDATE",
                "yesVotes", yesVotes,
                "totalVotes", totalVotes,
                "totalPlayers", totalPlayers
        ));

        if (yesVotes * 2 > totalPlayers) {
            endGame(session);
            return;
        }

        if (totalVotes == totalPlayers) {
            closeEndGameVoteWithCooldown(session, yesVotes, totalVotes, totalPlayers);
        }
    }

    @Override
    @Transactional
    public void leaveSession(String sessionId, String playerId) {
        GameSession session = requireSession(sessionId);

        SessionPlayer leaving = session.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Player not found in session: " + playerId));

        List<String> shipIds = shipClient.getPlayerShipIds(playerId);
        if (!shipIds.isEmpty()) {
            cargoClient.cancelContractsForShips(shipIds);
        }
        shipClient.deleteAllShipsOfPlayer(playerId);

        session.getPlayers().remove(leaving);

        if (session.getPlayers().isEmpty()) {
            sessionRepository.delete(session);
            return;
        }

        String newCreatorName = null;
        if (playerId.equals(session.getCreatorPlayerId())) {
            SessionPlayer newCreator = session.getPlayers().get(0);
            session.setCreatorPlayerId(newCreator.getPlayerId());
            newCreatorName = newCreator.getPlayerName();
        }

        sessionRepository.save(session);

        broadcaster.broadcastLobbyEvent(sessionId, Map.of(
                "event", "PLAYER_LEFT",
                "playerId", playerId,
                "playerName", leaving.getPlayerName(),
                "currentPlayers", session.getCurrentPlayers(),
                "maxPlayers", session.getMaxPlayers()
        ));

        if (newCreatorName != null) {
            broadcaster.broadcastLobbyEvent(sessionId, Map.of(
                    "event", "NEW_CREATOR",
                    "creatorId", session.getCreatorPlayerId(),
                    "creatorName", newCreatorName
            ));
        }
    }

    @Override
    @Transactional
    public void purgeIfEmpty(String sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getPlayers().isEmpty()) return;

        cargoClient.closeAllAcceptedContracts(session.getId());
        shipClient.deleteAllShipsOfSession(session.getId());
        newsItemRepository.deleteBySessionId(session.getId());
        sessionRepository.delete(session);
        log.info("Purged empty session {} (tick {})", sessionId, session.getCurrentTick());
    }

    @Override
    @Transactional
    public int incrementTick(String sessionId) {
        GameSession session = requireSession(sessionId);
        session.setCurrentTick(session.getCurrentTick() + 1);
        sessionRepository.save(session);
        return session.getCurrentTick();
    }

    @Override
    public void startMinigame(String sessionId, String shipId) {
        requireSession(sessionId);
        shipClient.startMinigame(shipId);
    }

    @Override
    public void finishMinigame(String sessionId, String shipId) {
        requireSession(sessionId);
        shipClient.finishMinigame(shipId);
    }

    // Internal helpers

    private void endGame(GameSession session) {
        session.setStatus(at.fhv.session.model.SessionStatus.FINISHED);
        sessionRepository.save(session);

        // Each step is best-effort: a downstream failure must not prevent deletion.
        try { cargoClient.closeAllAcceptedContracts(session.getId()); }
        catch (Exception e) { log.warn("endGame: failed to close contracts for {}: {}", session.getId(), e.getMessage()); }

        try { shipClient.deleteAllShipsOfSession(session.getId()); }
        catch (Exception e) { log.warn("endGame: failed to delete ships for {}: {}", session.getId(), e.getMessage()); }

        List<LeaderboardEntryDTO> leaderboard;
        try { leaderboard = playerClient.getLeaderboardForSession(session.getId()); }
        catch (Exception e) {
            log.warn("endGame: failed to fetch leaderboard for {}: {}", session.getId(), e.getMessage());
            leaderboard = List.of();
        }

        broadcaster.broadcastGameOver(session.getId(), Map.of(
                "event", "GAME_OVER",
                "isGameOver", true,
                "leaderboard", leaderboard
        ));

        sessionRepository.delete(session);
        log.info("Session {} ended and deleted (tick {})", session.getId(), session.getCurrentTick());
    }

    private void closeEndGameVoteWithCooldown(GameSession session, int yesVotes,
                                              int totalVotes, int totalPlayers) {
        long cooldownEnd = System.currentTimeMillis() + 5L * 60 * 1000;
        session.setEndGameVoteStarted(false);
        session.setNextEndGameVoteAt(cooldownEnd);
        session.getEndGameVotes().clear();
        sessionRepository.save(session);

        broadcaster.broadcastEndGameVote(session.getId(), Map.of(
                "event", "END_GAME_VOTE_CLOSED",
                "result", "NO_MAJORITY",
                "yesVotes", yesVotes,
                "totalVotes", totalVotes,
                "totalPlayers", totalPlayers,
                "cooldownUntil", cooldownEnd
        ));
    }

    private GameSession requireSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));
    }

    private SessionResponseDTO toResponse(GameSession session,
                                          String actingPlayerId,
                                          String actingPlayerName) {
        List<LobbyPlayerDTO> players = session.getPlayers().stream()
                .map(p -> new LobbyPlayerDTO(p.getPlayerId(), p.getPlayerName()))
                .toList();

        String creatorName = session.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(session.getCreatorPlayerId()))
                .map(SessionPlayer::getPlayerName)
                .findFirst()
                .orElse(null);

        return new SessionResponseDTO(
                session.getId(),
                session.getCode(),
                SessionStatus.valueOf(session.getStatus().name()),
                session.getCreatorPlayerId(),
                creatorName,
                session.getCurrentPlayers(),
                session.getMaxPlayers(),
                session.getCurrentTick(),
                actingPlayerId,
                actingPlayerName,
                players
        );
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            int length = RANDOM.nextBoolean() ? 4 : 8;
            StringBuilder sb = new StringBuilder(length);
            for (int i = 0; i < length; i++) {
                sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
            }
            String code = sb.toString();
            if (sessionRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException(
                "Could not generate a unique session code after " + MAX_CODE_ATTEMPTS + " attempts");
    }
}
