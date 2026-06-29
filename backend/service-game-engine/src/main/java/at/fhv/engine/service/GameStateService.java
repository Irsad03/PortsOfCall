package at.fhv.engine.service;

import at.fhv.engine.dto.GameStateMessageDTO;
import at.fhv.engine.dto.SessionResponseDTO;

public interface GameStateService {
    GameStateMessageDTO buildGameState(SessionResponseDTO session);
}
