package at.fhv.player.service;

import at.fhv.player.dto.CreatePlayerRequestDTO;
import at.fhv.player.dto.LeaderboardEntryDTO;
import at.fhv.player.dto.PlayerDTO;

import java.util.List;

public interface PlayerService {

    PlayerDTO createPlayer(CreatePlayerRequestDTO request);

    PlayerDTO findById(String id);

    List<PlayerDTO> findBySession(String sessionId);

    List<LeaderboardEntryDTO> getLeaderboard(String sessionId);

    PlayerDTO updateMoney(String id, int delta);

    PlayerDTO updateMoney(String id, int delta, boolean clampAtZero);

    PlayerDTO updatePosition(String id, int x, int y);

    PlayerDTO selectHomePort(String id, String portId);

    PlayerDTO updateCurrentPort(String id, String portId);

    PlayerDTO updateCurrentShip(String id, String shipId);

    PlayerDTO updateSession(String id, String sessionId);
}
