package at.fhv.freight.cargo.service.impl;

import at.fhv.freight.dto.AcceptCargoRequestDTO;
import at.fhv.freight.dto.CargoContractDTO;
import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.CloseOnArrivalResponseDTO;
import at.fhv.freight.dto.ContractFailedEventDTO;
import at.fhv.freight.dto.CustomsStatus;
import at.fhv.freight.dto.ForfeitContractRequestDTO;
import at.fhv.freight.dto.ForfeitContractResponseDTO;
import at.fhv.freight.dto.PlayerDTO;
import at.fhv.freight.dto.RewardEventDTO;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.dto.UnloadCargoRequestDTO;
import at.fhv.freight.dto.UnloadCargoResponseDTO;
import at.fhv.freight.cargo.model.CargoContract;
import at.fhv.freight.cargo.repository.CargoContractRepository;
import at.fhv.freight.cargo.service.CargoContractRefillService;
import at.fhv.freight.cargo.service.CargoNotFoundException;
import at.fhv.freight.cargo.service.CargoService;
import at.fhv.freight.cargo.service.WebSocketBroadcaster;
import at.fhv.freight.client.PlayerClient;
import at.fhv.freight.client.PortClient;
import at.fhv.freight.client.SessionNewsClient;
import at.fhv.freight.ship.model.PlayerShip;
import at.fhv.freight.ship.repository.PlayerShipRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CargoServiceImpl implements CargoService {

    // Deduction per tick over the contract deadline, subtracted from the cargo's
    // reward at unload time. Reward never goes below 0
    private static final int LATE_DEDUCTION_PER_TICK = 80;
    // Forfeit while still docked: player paid 50% of the would be reward as direct penalty
    private static final int FORFEIT_PENALTY_NUMERATOR = 1;
    private static final int FORFEIT_PENALTY_DENOMINATOR = 2;

    private final CargoContractRepository repository;
    private final CargoContractRefillService refillService;
    private final PortClient portClient;
    private final PlayerClient playerClient;
    private final WebSocketBroadcaster broadcaster;
    private final PlayerShipRepository playerShipRepository;
    private final SessionNewsClient sessionNewsClient;

    public CargoServiceImpl(CargoContractRepository repository,
                            CargoContractRefillService refillService,
                            PortClient portClient,
                            PlayerClient playerClient,
                            WebSocketBroadcaster broadcaster,
                            PlayerShipRepository playerShipRepository,
                            SessionNewsClient sessionNewsClient) {
        this.repository = repository;
        this.refillService = refillService;
        this.portClient = portClient;
        this.playerClient = playerClient;
        this.broadcaster = broadcaster;
        this.playerShipRepository = playerShipRepository;
        this.sessionNewsClient = sessionNewsClient;
    }

    // Marketplace queries
    @Override
    public List<CargoContractDTO> getContractsForPort(String sessionId, String portId, int currentTick) {
        return repository
                .findBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThan(
                        sessionId, portId, CargoStatus.OPEN, currentTick)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<CargoContractDTO> getAllOpenContracts(String sessionId, int currentTick) {
        return repository
                .findBySessionIdAndStatusAndExpiresAtTickGreaterThan(
                        sessionId, CargoStatus.OPEN, currentTick)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<CargoContractDTO> getContractsForShip(String shipId, CargoStatus status) {
        return repository.findByAssignedShipIdAndStatus(shipId, status).stream()
                .map(this::toDto)
                .toList();
    }

    // Lifecycle
    @Override
    @Transactional
    public void acceptContract(AcceptCargoRequestDTO request) {
        CargoContract contract = repository.findById(request.getContractId())
                .orElseThrow(() -> new CargoNotFoundException("Contract not found: " + request.getContractId()));

        if (contract.getStatus() != CargoStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Contract is not open");
        }

        PlayerShip ship = playerShipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not found: " + request.getShipId()));

        if (ship.getCurrentPortId() == null
                || !ship.getCurrentPortId().equals(contract.getOriginPortId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is not at the origin port of this contract. Current port: "
                            + ship.getCurrentPortId() + ", required: " + contract.getOriginPortId());
        }

        ShipStatus shipStatus = ship.getStatus();
        if (shipStatus == ShipStatus.IN_TRANSIT || shipStatus == ShipStatus.CUSTOMS_HOLD) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot accept cargo: ship is currently sailing or under customs hold.");
        }
        if (ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customs inspection pending — resolve it before accepting new cargo.");
        }

        // Allow max 1 legal + 1 illegal simultaneously.
        List<CargoContract> existingCargo = repository.findByAssignedShipIdAndStatus(
                request.getShipId(), CargoStatus.ACCEPTED);
        boolean newIsIllegal = contract.isIllegal();
        long sameTypeCount = existingCargo.stream()
                .filter(c -> c.isIllegal() == newIsIllegal)
                .count();
        if (sameTypeCount >= 1) {
            String type = newIsIllegal ? "illegal" : "legal";
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship already carries a " + type + " contract. Only 1 legal and 1 illegal contract are allowed at the same time.");
        }

        // Remaining capacity check.
        int usedCapacity = existingCargo.stream().mapToInt(CargoContract::getRequiredCapacity).sum();
        int remainingCapacity = ship.getCapacity() - usedCapacity;
        if (remainingCapacity < contract.getRequiredCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship capacity insufficient. Required: " + contract.getRequiredCapacity()
                            + ", remaining: " + remainingCapacity);
        }

        contract.setStatus(CargoStatus.ACCEPTED);
        contract.setAssignedShipId(request.getShipId());
        repository.save(contract);

        // Only transition to LOADING when ship was IDLE; if it is already LOADING or LOADED
        // (second contract added) the status stays as-is.
        if (shipStatus == ShipStatus.IDLE) {
            ship.setStatus(ShipStatus.LOADING);
            playerShipRepository.save(ship);
        }
    }

    @Override
    @Transactional
    public UnloadCargoResponseDTO unloadCargo(UnloadCargoRequestDTO request) {
        PlayerShip ship = playerShipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not found: " + request.getShipId()));

        ShipStatus status = ship.getStatus();
        if (status != ShipStatus.IDLE && status != ShipStatus.LOADED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ship must be docked to unload");
        }
        if (ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customs inspection pending — resolve it before unloading cargo.");
        }

        // CLOSED = arrived at destination
        // ACCEPTED = still loaded, may also be at destination if the contract was
        // accepted at this port, both are unloadable here.
        List<CargoContract> contracts = repository.findByAssignedShipIdAndStatus(
                request.getShipId(), CargoStatus.CLOSED);

        int currentTick = request.getCurrentTick();
        int totalReward = 0;
        int totalDeduction = 0;
        int contractsDelivered = 0;
        int contractsFailed = 0;
        int maxLateTicks = 0;
        int ratsLoss = 0;
        int contractsHitByRats = 0;
        String sessionIdForBroadcast = null;
        PlayerDTO updatedPlayer = null;
        java.util.List<ContractFailedEventDTO> failureEvents = new java.util.ArrayList<>();
        // Parallel to failureEvents — keeps the contract reference so the
        // newspaper article can name the destination port.
        java.util.List<CargoContract> failedContracts = new java.util.ArrayList<>();

        for (CargoContract contract : contracts) {
            if (!contract.getDestinationPortId().equals(ship.getCurrentPortId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Cargo can only be unloaded at its destination port.");
            }
            sessionIdForBroadcast = contract.getSessionId();

            int lateTicks = 0;
            if (!contract.isIllegal()
                    && contract.getExpiresAtTick() != null
                    && currentTick > contract.getExpiresAtTick()) {
                lateTicks = currentTick - contract.getExpiresAtTick();
            }

            int fullReward = contract.getReward();
            int payout;
            if (lateTicks > 0) {
                // Late delivery: deduct per-tick from cargo wage. Min 0 — never
                // dips into the player's balance.
                int deduction = Math.min(fullReward, lateTicks * LATE_DEDUCTION_PER_TICK);
                payout = Math.max(0, fullReward - deduction);
                totalDeduction += deduction;
                contractsFailed++;
                maxLateTicks = Math.max(maxLateTicks, lateTicks);
                contract.setStatus(CargoStatus.FAILED);
                contract.setReward(payout);
                failureEvents.add(new ContractFailedEventDTO(
                        contract.getId(), request.getPlayerId(), null,
                        deduction, 0, "DEADLINE_EXPIRED",
                        contract.getDescription(), lateTicks));
                failedContracts.add(contract);
            } else {
                payout = fullReward;
                contractsDelivered++;
                contract.setStatus(CargoStatus.DELIVERED);
            }
            if (contract.getRatsValueLoss() > 0) {
                ratsLoss += contract.getRatsValueLoss();
                contractsHitByRats++;
            }

            totalReward += payout;
            repository.save(contract);
        }

        if (totalReward > 0) {
            updatedPlayer = playerClient.updateMoney(request.getPlayerId(), totalReward);
            if (updatedPlayer != null && sessionIdForBroadcast != null) {
                broadcaster.broadcastReward(sessionIdForBroadcast,
                        new RewardEventDTO(updatedPlayer.getId(), updatedPlayer.getName(),
                                totalReward, updatedPlayer.getMoney()));
            }
        } else if (!failureEvents.isEmpty()) {
            // Fetch balance for the broadcast even when nothing was paid out.
            updatedPlayer = playerClient.getPlayer(request.getPlayerId());
        }

        if (updatedPlayer != null && sessionIdForBroadcast != null) {
            for (int i = 0; i < failureEvents.size(); i++) {
                ContractFailedEventDTO ev = failureEvents.get(i);
                ev.setPlayerName(updatedPlayer.getName());
                ev.setNewBalance(updatedPlayer.getMoney());
                broadcaster.broadcastContractFailed(sessionIdForBroadcast, ev);

                // finance article for the global newspaper.
                CargoContract failed = failedContracts.get(i);
                String destPort = portClient.getPortName(failed.getDestinationPortId());
                sessionNewsClient.postNews(sessionIdForBroadcast, currentTick,
                        "Deadline missed: late delivery in " + destPort,
                        "Captain " + updatedPlayer.getName() + " delivered \""
                                + failed.getDescription() + "\" " + ev.getLateTicks()
                                + " tick" + (ev.getLateTicks() == 1 ? "" : "s")
                                + " past the agreed deadline. " + ev.getPenalty()
                                + " Taler was docked from the freight wage.",
                        "FINANCE",
                        List.of(failed.getOriginPortId(), failed.getDestinationPortId()));
            }
        }

        return new UnloadCargoResponseDTO(totalReward, contractsDelivered,
                contractsFailed, totalDeduction, maxLateTicks, ratsLoss, contractsHitByRats);
    }

    @Override
    @Transactional
    public ForfeitContractResponseDTO forfeitContract(ForfeitContractRequestDTO request) {
        PlayerShip ship = playerShipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not found: " + request.getShipId()));

        ShipStatus status = ship.getStatus();
        if (status == ShipStatus.IN_TRANSIT
                || status == ShipStatus.AWAITING_PILOT
                || status == ShipStatus.CUSTOMS_HOLD) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot forfeit cargo while ship is at sea or under customs hold.");
        }
        if (ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customs inspection pending — resolve it before forfeiting cargo.");
        }

        CargoContract contract = repository.findById(request.getContractId())
                .orElseThrow(() -> new CargoNotFoundException("Contract not found: " + request.getContractId()));

        if (!request.getShipId().equals(contract.getAssignedShipId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Contract is not assigned to this ship.");
        }
        if (contract.getStatus() != CargoStatus.ACCEPTED
                && contract.getStatus() != CargoStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only loaded (accepted) cargo can be forfeited.");
        }

        int penalty = (contract.getReward() * FORFEIT_PENALTY_NUMERATOR) / FORFEIT_PENALTY_DENOMINATOR;
        // Immediate money deduction — no waiting for next tick.
        PlayerDTO updatedPlayer = playerClient.updateMoney(request.getPlayerId(), -penalty);

        contract.setStatus(CargoStatus.FAILED);
        repository.save(contract);

        long remainingAccepted = repository
                .findByAssignedShipIdAndStatus(request.getShipId(), CargoStatus.ACCEPTED)
                .size();
        ship.setStatus(remainingAccepted > 0 ? ShipStatus.LOADED : ShipStatus.IDLE);
        playerShipRepository.save(ship);

        if (updatedPlayer != null) {
            broadcaster.broadcastContractFailed(contract.getSessionId(),
                    new ContractFailedEventDTO(
                            contract.getId(),
                            updatedPlayer.getId(),
                            updatedPlayer.getName(),
                            penalty,
                            updatedPlayer.getMoney(),
                            "FORFEITED",
                            contract.getDescription(),
                            0));

            String originPort = portClient.getPortName(contract.getOriginPortId());
            sessionNewsClient.postNews(contract.getSessionId(), null,
                    "Contract forfeited in " + originPort,
                    "Captain " + updatedPlayer.getName() + " walked away from \""
                            + contract.getDescription() + "\". The freight broker collected a "
                            + penalty + " Taler cancellation penalty.",
                    "FINANCE",
                    List.of(contract.getOriginPortId(), contract.getDestinationPortId()));
            return new ForfeitContractResponseDTO(penalty, updatedPlayer.getMoney());
        }
        return new ForfeitContractResponseDTO(penalty, 0);
    }

    // Tick session lifecycle

    @Override
    @Transactional
    public void refillContracts(String sessionId, int currentTick) {
        refillService.refill(sessionId, currentTick);
        broadcaster.broadcastCargoRefresh(sessionId);
    }

    @Override
    @Transactional
    public void closeAllAcceptedContracts(String sessionId) {
        List<CargoContract> accepted = repository.findBySessionIdAndStatus(sessionId, CargoStatus.ACCEPTED);
        for (CargoContract c : accepted) {
            c.setStatus(CargoStatus.CLOSED);
        }
        repository.saveAll(accepted);
    }

    @Override
    @Transactional
    public void deleteExpiredOpenContracts(String sessionId, int currentTick) {
        repository.deleteBySessionIdAndStatusAndExpiresAtTickLessThanEqual(
                sessionId, CargoStatus.OPEN, currentTick);
    }

    @Override
    @Transactional
    public CargoContractDTO updateStatus(String contractId, CargoStatus status) {
        CargoContract contract = repository.findById(contractId)
                .orElseThrow(() -> new CargoNotFoundException("Contract not found: " + contractId));
        contract.setStatus(status);
        return toDto(repository.save(contract));
    }

    @Override
    @Transactional
    public CloseOnArrivalResponseDTO closeOnArrival(String shipId, String portId, int currentTick) {
        List<CargoContract> contracts = repository
                .findByAssignedShipIdAndStatus(shipId, CargoStatus.ACCEPTED);

        int profit = 0;
        int closed = 0;
        for (CargoContract contract : contracts) {
            if (!portId.equals(contract.getDestinationPortId())) continue;
            profit += contract.getReward();
            closed++;
            contract.setStatus(CargoStatus.CLOSED);
        }
        if (closed > 0) {
            repository.saveAll(contracts);
        }
        return new CloseOnArrivalResponseDTO(profit, closed);
    }

    @Override
    @Transactional
    public void cancelContractsForShips(List<String> shipIds) {
        if (shipIds == null || shipIds.isEmpty()) return;
        repository.deleteByAssignedShipIdIn(shipIds);
    }

    // Mapping helpers

    private CargoContractDTO toDto(CargoContract c) {
        return new CargoContractDTO(
                c.getId(),
                c.getDescription(),
                c.getReward(),
                c.getRequiredCapacity(),
                c.getOriginPortId(),
                portClient.getPortName(c.getOriginPortId()),
                c.getDestinationPortId(),
                portClient.getPortName(c.getDestinationPortId()),
                c.getRiskLevel(),
                c.getExpiresAtTick(),
                c.getStatus(),
                c.getAssignedShipId(),
                c.isIllegal()
        );
    }
}