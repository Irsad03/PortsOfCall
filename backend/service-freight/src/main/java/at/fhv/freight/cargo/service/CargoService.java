package at.fhv.freight.cargo.service;

import at.fhv.freight.dto.AcceptCargoRequestDTO;
import at.fhv.freight.dto.CargoContractDTO;
import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.CloseOnArrivalResponseDTO;
import at.fhv.freight.dto.ForfeitContractRequestDTO;
import at.fhv.freight.dto.ForfeitContractResponseDTO;
import at.fhv.freight.dto.UnloadCargoRequestDTO;
import at.fhv.freight.dto.UnloadCargoResponseDTO;

import java.util.List;

public interface CargoService {

    List<CargoContractDTO> getContractsForPort(String sessionId, String portId, int currentTick);

    List<CargoContractDTO> getAllOpenContracts(String sessionId, int currentTick);

    List<CargoContractDTO> getContractsForShip(String shipId, CargoStatus status);

    void acceptContract(AcceptCargoRequestDTO request);

    UnloadCargoResponseDTO unloadCargo(UnloadCargoRequestDTO request);

    ForfeitContractResponseDTO forfeitContract(ForfeitContractRequestDTO request);

    void refillContracts(String sessionId, int currentTick);

    void closeAllAcceptedContracts(String sessionId);

    void deleteExpiredOpenContracts(String sessionId, int currentTick);

    CargoContractDTO updateStatus(String contractId, CargoStatus status);

    CloseOnArrivalResponseDTO closeOnArrival(String shipId, String portId, int currentTick);

    void cancelContractsForShips(List<String> shipIds);
}
