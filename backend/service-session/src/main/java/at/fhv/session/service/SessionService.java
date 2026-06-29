package at.fhv.session.service;

import at.fhv.session.dto.CreateSessionRequestDTO;
import at.fhv.session.dto.JoinSessionRequestDTO;
import at.fhv.session.dto.LobbyPlayerDTO;
import at.fhv.session.dto.SessionResponseDTO;
import at.fhv.session.dto.VoteEndGameRequestDTO;

import java.util.List;

public interface SessionService {

    SessionResponseDTO createSession(CreateSessionRequestDTO request);

    SessionResponseDTO joinSession(JoinSessionRequestDTO request);

    SessionResponseDTO startSession(String sessionId, String playerId);

    SessionResponseDTO getSession(String sessionId);

    List<LobbyPlayerDTO> getSessionPlayers(String sessionId);

    List<SessionResponseDTO> getActiveSessions();

    void startEndGameVote(String sessionId, String playerId);

    void voteEndGame(String sessionId, VoteEndGameRequestDTO request);

    void leaveSession(String sessionId, String playerId);

    int incrementTick(String sessionId);

    void purgeIfEmpty(String sessionId);

    void startMinigame(String sessionId, String shipId);

    void finishMinigame(String sessionId, String shipId);
}
