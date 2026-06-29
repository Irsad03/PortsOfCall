package at.fhv.engine.service.impl;

import at.fhv.engine.dto.ActiveShipStateDTO;
import at.fhv.engine.dto.CurrentShipDTO;
import at.fhv.engine.dto.FleetShipDTO;
import at.fhv.engine.dto.GameStateMessageDTO;
import at.fhv.engine.dto.PlayerDTO;
import at.fhv.engine.dto.PlayerStateDTO;
import at.fhv.engine.dto.RouteDTO;
import at.fhv.engine.dto.SessionResponseDTO;
import at.fhv.engine.dto.ShipStatus;
import at.fhv.engine.dto.WaypointDTO;
import at.fhv.engine.client.PlayerClient;
import at.fhv.engine.client.RouteClient;
import at.fhv.engine.client.ShipClient;
import at.fhv.engine.service.GameStateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameStateServiceImpl implements GameStateService {

    private static final Logger log = LoggerFactory.getLogger(GameStateServiceImpl.class);

    private final PlayerClient playerClient;
    private final ShipClient shipClient;
    private final RouteClient routeClient;

    public GameStateServiceImpl(PlayerClient playerClient,
                                ShipClient shipClient,
                                RouteClient routeClient) {
        this.playerClient = playerClient;
        this.shipClient = shipClient;
        this.routeClient = routeClient;
    }

    @Override
    public GameStateMessageDTO buildGameState(SessionResponseDTO session) {
        List<PlayerDTO> players = playerClient.getPlayersBySession(session.getId());
        List<FleetShipDTO> sessionShips = shipClient.getAllShipsOfSession(session.getId());

        Map<String, PlayerDTO> playersById = new HashMap<>();
        for (PlayerDTO p : players) playersById.put(p.getId(), p);

        Map<String, FleetShipDTO> shipsById = new HashMap<>();
        for (FleetShipDTO s : sessionShips) shipsById.put(s.getId(), s);

        List<PlayerStateDTO> playerStates = new ArrayList<>();
        for (PlayerDTO player : players) {
            try {
                playerStates.add(toPlayerState(player, shipsById));
            } catch (Exception ex) {
                log.warn("Skipping player {} in game state: {}", player.getId(), ex.getMessage());
            }
        }

        List<ActiveShipStateDTO> activeShips = new ArrayList<>();
        for (FleetShipDTO ship : sessionShips) {
            try {
                PlayerDTO owner = playersById.get(ship.getPlayerId());
                activeShips.add(toActiveShip(ship, owner != null ? owner.getName() : "Unknown"));
            } catch (Exception ex) {
                log.warn("Skipping ship {} in game state: {}", ship.getId(), ex.getMessage());
            }
        }

        return new GameStateMessageDTO(session.getId(), session.getCurrentTick(),
                playerStates, activeShips);
    }

    // Helpers

    private PlayerStateDTO toPlayerState(PlayerDTO player, Map<String, FleetShipDTO> shipsById) {
        FleetShipDTO currentShip = player.getCurrentShipId() != null
                ? shipsById.get(player.getCurrentShipId())
                : null;

        ShipStatus status = currentShip != null ? currentShip.getStatus() : ShipStatus.IDLE;
        String currentPortId = player.getCurrentPortId();
        if (currentShip != null && currentShip.getCurrentPortId() != null) {
            currentPortId = currentShip.getCurrentPortId();
        }

        CurrentShipDTO currentShipDto = currentShip != null
                ? toCurrentShipDto(currentShip)
                : null;

        PlayerStateDTO state = new PlayerStateDTO(
                player.getId(), player.getName(), player.getMoney(),
                player.getPositionX(), player.getPositionY(),
                status, currentPortId, currentShipDto);
        state.setNetWorth(player.getNetWorth());
        return state;
    }

    private CurrentShipDTO toCurrentShipDto(FleetShipDTO ship) {
        List<WaypointDTO> waypoints = resolveWaypoints(ship);
        return new CurrentShipDTO(
                ship.getId(),
                ship.getName(),
                ship.getShipClass(),
                ship.getCapacity(),
                ship.getStatus(),
                ship.getActiveRouteId(),
                ship.getCurrentWaypointIndex(),
                waypoints,
                ship.getLastVoyageProfit(),
                ship.getFuelLevel(),
                ship.getFuelConsumptionPerTick(),
                ship.isHasPilot(),
                ship.getHealthPoints()
        );
    }

    private ActiveShipStateDTO toActiveShip(FleetShipDTO ship, String playerName) {
        List<WaypointDTO> waypoints = resolveWaypoints(ship);
        String status = ship.getStatus() != null ? ship.getStatus().name() : ShipStatus.IDLE.name();
        ActiveShipStateDTO dto = new ActiveShipStateDTO(
                ship.getPlayerId(),
                playerName,
                ship.getId(),
                ship.getName(),
                status,
                ship.getCurrentWaypointIndex(),
                waypoints,
                ship.getCurrentPortId(),
                ship.getCustomsStatus()
        );
        dto.setDistancePerTick(ship.getDistancePerTick());
        dto.setRouteProgress(ship.getRouteProgress());
        return dto;
    }

    private List<WaypointDTO> resolveWaypoints(FleetShipDTO ship) {
        if (ship.getActiveRouteWaypoints() != null && !ship.getActiveRouteWaypoints().isEmpty()) {
            return ship.getActiveRouteWaypoints();
        }
        if (ship.getActiveRouteId() == null) return null;
        RouteDTO route = routeClient.getRoute(ship.getActiveRouteId());
        return route != null ? route.getWaypoints() : null;
    }
}
