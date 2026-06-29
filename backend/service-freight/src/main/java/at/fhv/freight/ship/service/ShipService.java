package at.fhv.freight.ship.service;

import at.fhv.freight.dto.BuyShipRequestDTO;
import at.fhv.freight.dto.CreateShipRequestDTO;
import at.fhv.freight.dto.FleetShipDTO;
import at.fhv.freight.dto.HirePilotResponseDTO;
import at.fhv.freight.dto.MarketShipDTO;
import at.fhv.freight.dto.NavigateSelfResponseDTO;
import at.fhv.freight.dto.RefuelResponseDTO;
import at.fhv.freight.dto.RepairResponseDTO;
import at.fhv.freight.dto.SessionTickResultDTO;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.dto.StartRouteRequestDTO;
import at.fhv.freight.dto.StartRouteResponseDTO;

import java.util.List;

public interface ShipService {

    List<MarketShipDTO> getMarketShips();

    MarketShipDTO addMarketShip(CreateShipRequestDTO request);

    void buyShip(BuyShipRequestDTO request);

    at.fhv.freight.dto.SellShipResponseDTO sellShip(String playerId, String shipId);

    List<FleetShipDTO> getPlayerFleet(String playerId);

    List<FleetShipDTO> getShipsAtPort(String portId, String playerId);

    FleetShipDTO getShip(String shipId);

    void deleteAllShipsOfPlayer(String playerId);

    void deleteAllShipsOfSession(String sessionId);

    RefuelResponseDTO refuelShip(String playerId, String shipId);

    RepairResponseDTO repairShip(String playerId, String shipId);

    HirePilotResponseDTO hirePilot(String playerId, String shipId);

    NavigateSelfResponseDTO navigateSelf(String playerId, String shipId);

    at.fhv.freight.dto.ParkingResultResponseDTO submitParkingResult(at.fhv.freight.dto.ParkingResultRequestDTO request);

    StartRouteResponseDTO startRoute(StartRouteRequestDTO request);

    StartRouteResponseDTO resumeRouteAfterSmugglingDecision(String shipId, String playerId);

    void moveShip(String shipId, String newPortId);

    FleetShipDTO updateStatus(String shipId, ShipStatus status);

    FleetShipDTO setMortgaged(String shipId, boolean mortgaged);

    FleetShipDTO seizeShip(String shipId);

    void startMinigame(String shipId);

    void finishMinigame(String shipId);

    at.fhv.freight.dto.RatsResultResponseDTO finishRatsMinigame(String shipId, at.fhv.freight.dto.RatsResultRequestDTO request);

    at.fhv.freight.dto.OverboardResultResponseDTO finishOverboardMinigame(
            String shipId, at.fhv.freight.dto.OverboardResultRequestDTO request);

    List<FleetShipDTO> getAllShipsOfSession(String sessionId);

    SessionTickResultDTO processTickForSession(String sessionId, int currentTick);
}
