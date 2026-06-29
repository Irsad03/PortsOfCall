package at.fhv.freight.customs.service.impl;

import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.CustomsInspectionDTO;
import at.fhv.freight.dto.CustomsStatus;
import at.fhv.freight.dto.CustomsStatusDTO;
import at.fhv.freight.dto.InspectionResultDTO;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.cargo.model.CargoContract;
import at.fhv.freight.cargo.repository.CargoContractRepository;
import at.fhv.freight.client.PlayerClient;
import at.fhv.freight.client.PortClient;
import at.fhv.freight.client.SessionNewsClient;
import at.fhv.freight.customs.service.CustomsService;
import at.fhv.freight.customs.service.CustomsWebSocketBroadcaster;
import at.fhv.freight.ship.model.PlayerShip;
import at.fhv.freight.ship.repository.PlayerShipRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import static java.util.List.of;

@Service
public class CustomsServiceImpl implements CustomsService {

    private static final Logger log = LoggerFactory.getLogger(CustomsServiceImpl.class);

    private static final List<CargoStatus> ON_BOARD_STATUSES =
            of(CargoStatus.ACCEPTED, CargoStatus.CLOSED, CargoStatus.PENDING_CONFISCATION);

    private final PlayerShipRepository playerShipRepository;
    private final CargoContractRepository cargoContractRepository;
    private final PlayerClient playerClient;
    private final PortClient portClient;
    private final SessionNewsClient sessionNewsClient;
    private final CustomsWebSocketBroadcaster broadcaster;

    @Value("${customs.trigger-probability:0.35}")
    private double triggerProbability;

    @Value("${customs.min-hold-ticks:1}")
    private int minHoldTicks;

    @Value("${customs.max-hold-ticks:5}")
    private int maxHoldTicks;

    @Value("${customs.min-processing-ticks:1}")
    private int minProcessingTicks;

    @Value("${customs.max-processing-ticks:3}")
    private int maxProcessingTicks;

    @Value("${customs.bribe-threshold-multiplier:0.75}")
    private double bribeThresholdMultiplier;

    public CustomsServiceImpl(PlayerShipRepository playerShipRepository,
                              CargoContractRepository cargoContractRepository,
                              PlayerClient playerClient,
                              PortClient portClient,
                              SessionNewsClient sessionNewsClient,
                              CustomsWebSocketBroadcaster broadcaster) {
        this.playerShipRepository = playerShipRepository;
        this.cargoContractRepository = cargoContractRepository;
        this.playerClient = playerClient;
        this.portClient = portClient;
        this.sessionNewsClient = sessionNewsClient;
        this.broadcaster = broadcaster;
    }

    // Trigger

    @Override
    @Transactional
    public void triggerIfApplicable(PlayerShip ship) {
        if (ship.getCustomsStatus() != CustomsStatus.NONE) return;

        if (ThreadLocalRandom.current().nextDouble() >= triggerProbability) return;

        List<CargoContract> illegalContracts =
                cargoContractRepository.findByAssignedShipIdAndIllegalTrueAndStatusIn(
                        ship.getId(), ON_BOARD_STATUSES);

        int illegalValue = illegalContracts.stream().mapToInt(CargoContract::getReward).sum();

        ship.setCustomsStatus(CustomsStatus.PENDING_DECISION);
        playerShipRepository.save(ship);

        broadcaster.broadcastInspectionTriggered(
                ship.getSessionId(),
                ship.getPlayerId(),
                new CustomsInspectionDTO(
                        ship.getId(),
                        ship.getPlayerId(),
                        ship.getSessionId(),
                        !illegalContracts.isEmpty(),
                        illegalValue
                )
        );

        log.info("Customs triggered for ship {} (player {})", ship.getId(), ship.getPlayerId());
    }

    // Player decisions

    @Override
    @Transactional
    public CustomsStatusDTO submitToInspection(String shipId, String playerId) {
        PlayerShip ship = requireOwnedShip(shipId, playerId);
        requirePendingDecision(ship);

        List<CargoContract> illegalContracts =
                cargoContractRepository.findByAssignedShipIdAndIllegalTrueAndStatusIn(
                        shipId, ON_BOARD_STATUSES);

        boolean cleared;
        int totalFine = 0;

        if (illegalContracts.isEmpty()) {
            cleared = true;
        } else {
            List<String> toConfiscate = new ArrayList<>();
            for (CargoContract contract : illegalContracts) {
                double detectionChance = detectionProbabilityFor(contract.getRiskLevel());
                if (ThreadLocalRandom.current().nextDouble() < detectionChance) {
                    contract.setStatus(CargoStatus.PENDING_CONFISCATION);
                    cargoContractRepository.save(contract);
                    totalFine += fineFor(contract);
                    toConfiscate.add(contract.getId());
                }
            }
            cleared = toConfiscate.isEmpty();
        }

        return startProcessing(ship, cleared, totalFine);
    }

    @Override
    @Transactional
    public CustomsStatusDTO offerBribe(String shipId, String playerId, int bribeAmount) {
        PlayerShip ship = requireOwnedShip(shipId, playerId);
        requirePendingDecision(ship);

        List<CargoContract> illegalContracts =
                cargoContractRepository.findByAssignedShipIdAndIllegalTrueAndStatusIn(
                        shipId, ON_BOARD_STATUSES);

        if (illegalContracts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No illegal goods on board — bribing is not an option");
        }

        int illegalValue = illegalContracts.stream().mapToInt(CargoContract::getReward).sum();
        int threshold    = (int) (illegalValue * bribeThresholdMultiplier);
        double successProbability = Math.min(1.0, (double) bribeAmount / threshold);

        // Money leaves the player's account immediately, regardless of outcome.
        deductSafely(playerId, bribeAmount, "bribe payment");

        boolean accepted = ThreadLocalRandom.current().nextDouble() < successProbability;
        int totalFine = 0;

        if (!accepted) {
            // Failed bribe = 100% detection
            for (CargoContract contract : illegalContracts) {
                contract.setStatus(CargoStatus.PENDING_CONFISCATION);
                cargoContractRepository.save(contract);
                totalFine += fineFor(contract);
            }
        }

        log.info("Bribe {} for ship {} (P={}) — processing starts",
                accepted ? "ACCEPTED" : "REJECTED", shipId, successProbability);
        return startProcessing(ship, accepted, totalFine);
    }

    // Status

    @Override
    public CustomsStatusDTO getStatus(String shipId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ship not found"));
        return new CustomsStatusDTO(shipId, ship.getCustomsStatus(), ship.getCustomsHoldRemainingTicks());
    }

    // Tick processing

    @Override
    @Transactional
    public void processHoldTick(String sessionId) {
        List<PlayerShip> shipsOnHold = playerShipRepository
                .findAllBySessionIdAndStatus(sessionId, ShipStatus.CUSTOMS_HOLD);

        for (PlayerShip ship : shipsOnHold) {
            int remaining = ship.getCustomsHoldRemainingTicks() - 1;
            ship.setCustomsHoldRemainingTicks(Math.max(0, remaining));

            // <= 0 (not == 0) so a ship already at a non-positive counter is
            // recovered on the next tick instead of being frozen.
            if (remaining <= 0) {
                if (ship.getCustomsStatus() == CustomsStatus.PROCESSING) {
                    // Processing done → apply stored result, start actual hold phase.
                    applyProcessingResult(ship, sessionId);
                } else {
                    // CLEARED / PENALIZED hold done (or stuck) -> release ship
                    ship.setStatus(ShipStatus.IDLE);
                    ship.setCustomsStatus(CustomsStatus.NONE);
                    broadcaster.broadcastStatusUpdate(
                            sessionId,
                            new CustomsStatusDTO(ship.getId(), CustomsStatus.NONE, 0)
                    );
                    log.info("Ship {} released from customs hold", ship.getId());
                }
            }
            playerShipRepository.save(ship);
        }
    }

    // Private helpers

    private CustomsStatusDTO startProcessing(PlayerShip ship, boolean cleared, int fine) {
        int processingTicks = randomProcessingTicks();
        ship.setCustomsStatus(CustomsStatus.PROCESSING);
        ship.setCustomsHoldRemainingTicks(processingTicks);
        ship.setStatus(ShipStatus.CUSTOMS_HOLD);
        ship.setCustomsProcessingCleared(cleared);
        ship.setCustomsProcessingFine(fine);
        playerShipRepository.save(ship);

        log.info("Ship {} entering processing — cleared={}, ticks={}", ship.getId(), cleared, processingTicks);
        return new CustomsStatusDTO(ship.getId(), CustomsStatus.PROCESSING, processingTicks);
    }

    private void applyProcessingResult(PlayerShip ship, String sessionId) {
        boolean cleared = Boolean.TRUE.equals(ship.getCustomsProcessingCleared());
        int fine        = ship.getCustomsProcessingFine();

        List<CargoContract> pendingContracts = cargoContractRepository
                .findByAssignedShipIdAndStatus(ship.getId(), CargoStatus.PENDING_CONFISCATION);
        List<String> confiscatedIds = new ArrayList<>();
        for (CargoContract contract : pendingContracts) {
            contract.setStatus(CargoStatus.CONFISCATED);
            cargoContractRepository.save(contract);
            confiscatedIds.add(contract.getId());
        }

        if (!cleared && fine > 0) {
            deductSafely(ship.getPlayerId(), fine, "customs fine (after processing)", true);
        }

        int holdTicks = randomHoldTicks();
        ship.setCustomsStatus(cleared ? CustomsStatus.CLEARED : CustomsStatus.PENALIZED);
        ship.setCustomsHoldRemainingTicks(holdTicks);
        ship.setCustomsProcessingCleared(null);
        ship.setCustomsProcessingFine(0);
        // ShipStatus stays CUSTOMS_HOLD until the hold phase ends.

        // Build and broadcast the final result.
        InspectionResultDTO result = new InspectionResultDTO();
        result.setDetected(!cleared);
        result.setConfiscatedContractIds(confiscatedIds);
        result.setTotalFine(cleared ? 0 : fine);
        result.setHoldTicks(holdTicks);
        broadcaster.broadcastInspectionResult(sessionId, ship.getPlayerId(), result);

        if (!cleared && !confiscatedIds.isEmpty()) {
            String portId = ship.getCurrentPortId();
            String portName = portId != null ? portClient.getPortName(portId) : "a foreign harbour";
            sessionNewsClient.postNews(sessionId, null,
                    "Smuggler caught in " + portName,
                    "A captain was caught smuggling in " + portName
                            + ". Customs officials confiscated " + confiscatedIds.size()
                            + " illegal shipment" + (confiscatedIds.size() == 1 ? "" : "s")
                            + (fine > 0 ? " and issued a fine of " + fine + " Taler." : ".")
                            + " The vessel remains under customs hold.",
                    "INCIDENT",
                    portId != null ? java.util.List.of(portId) : java.util.List.of());
        }

        log.info("Processing complete for ship {} — cleared={}, fine={}, hold ticks={}",
                ship.getId(), cleared, fine, holdTicks);
    }

    private PlayerShip requireOwnedShip(String shipId, String playerId) {
        return playerShipRepository.findByIdAndPlayerId(shipId, playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not found or not owned by player"));
    }

    private void requirePendingDecision(PlayerShip ship) {
        if (ship.getCustomsStatus() != CustomsStatus.PENDING_DECISION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No active customs inspection for this ship");
        }
    }

    private void deductSafely(String playerId, int amount, String context) {
        deductSafely(playerId, amount, context, false);
    }

    private void deductSafely(String playerId, int amount, String context, boolean clampAtZero) {
        if (amount <= 0) return;
        try {
            playerClient.updateMoney(playerId, -amount, clampAtZero);
        } catch (Exception ex) {
            log.error("CRITICAL: {} deduction of {} for player {} failed — manual intervention required",
                    context, amount, playerId, ex);
        }
    }

    private double detectionProbabilityFor(String riskLevel) {
        return "HIGH".equalsIgnoreCase(riskLevel) ? 0.70 : 0.30;
    }

    private int fineFor(CargoContract contract) {
        return "HIGH".equalsIgnoreCase(contract.getRiskLevel())
                ? contract.getReward()
                : contract.getReward() / 2;
    }

    private int randomHoldTicks() {
        return ThreadLocalRandom.current().nextInt(minHoldTicks, maxHoldTicks + 1);
    }

    private int randomProcessingTicks() {
        return ThreadLocalRandom.current().nextInt(minProcessingTicks, maxProcessingTicks + 1);
    }
}