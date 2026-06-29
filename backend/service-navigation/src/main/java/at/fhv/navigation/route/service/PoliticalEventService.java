package at.fhv.navigation.route.service;

import at.fhv.navigation.dto.PoliticalEventDTO;

import java.util.List;

public interface PoliticalEventService {
    List<PoliticalEventDTO> processTick();
    List<PoliticalEventDTO.PortPair> getCurrentlyBlockedRoutes();
    List<String> getCurrentPilotStrikePortIds();
}
