package at.fhv.freight.smuggling.service.impl;

import at.fhv.freight.cargo.model.CargoContract;
import at.fhv.freight.cargo.repository.CargoContractRepository;
import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.SmugglingOfferDTO;
import at.fhv.freight.ship.model.PlayerShip;
import at.fhv.freight.ship.repository.PlayerShipRepository;
import at.fhv.freight.smuggling.service.SmugglingService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SmugglingServiceImpl implements SmugglingService {

    private static final Logger log = LoggerFactory.getLogger(SmugglingServiceImpl.class);

    private static final List<CargoStatus> ON_BOARD =
            List.of(CargoStatus.ACCEPTED, CargoStatus.CLOSED, CargoStatus.PENDING_CONFISCATION);


    private static final List<OfferTemplate> TEMPLATES = List.of(
            new OfferTemplate("Contraband [ILLEGAL]",               5000, 9000,  50, 100),
            new OfferTemplate("Untaxed Electronics [ILLEGAL]",      7000, 12000, 60, 120),
            new OfferTemplate("Banned Chemicals [ILLEGAL]",         9000, 15000, 80, 150),
            new OfferTemplate("Smuggled Spirits [ILLEGAL]",         6000, 10000, 50, 120),
            new OfferTemplate("Exotic Animal Products [ILLEGAL]",   8000, 13000, 60, 140)
    );

    private final PlayerShipRepository playerShipRepository;
    private final CargoContractRepository cargoContractRepository;

    @Value("${smuggling.offer-probability:0.25}")
    private double offerProbability;

    public SmugglingServiceImpl(PlayerShipRepository playerShipRepository,
                                CargoContractRepository cargoContractRepository) {
        this.playerShipRepository = playerShipRepository;
        this.cargoContractRepository = cargoContractRepository;
    }

    @Override
    @Transactional
    public SmugglingOfferDTO maybeGenerateOffer(PlayerShip ship, String destinationPortId) {
        // No offer if there's still an unresolved one.
        if (ship.getPendingSmugglingOffer() != null) return null;

        // No offer if ship already carries illegal cargo (one smuggling job at a time).
        if (!cargoContractRepository.findByAssignedShipIdAndIllegalTrueAndStatusIn(
                ship.getId(), ON_BOARD).isEmpty()) {
            return null;
        }

        // Dice roll — smuggler may not show up.
        if (ThreadLocalRandom.current().nextDouble() >= offerProbability) return null;

        OfferTemplate tmpl = TEMPLATES.get(ThreadLocalRandom.current().nextInt(TEMPLATES.size()));
        int reward = tmpl.minReward + ThreadLocalRandom.current().nextInt(tmpl.maxReward - tmpl.minReward + 1);
        int capacity = tmpl.minCapacity + ThreadLocalRandom.current().nextInt(
                tmpl.maxCapacity - tmpl.minCapacity + 1);

        SmugglingOfferDTO offer = new SmugglingOfferDTO(
                UUID.randomUUID().toString(),
                tmpl.description,
                reward,
                capacity,
                ship.getCurrentPortId(),
                destinationPortId,
                "HIGH"
        );

        ship.setPendingSmugglingOffer(offer);
        ship.setPendingRouteDestinationPortId(destinationPortId);
        playerShipRepository.save(ship);

        log.info("Smuggling offer generated for ship {} → {} (reward {}€, capacity {}t)",
                ship.getId(), destinationPortId, reward, capacity);
        return offer;
    }

    @Override
    @Transactional
    public String acceptOffer(String shipId, String playerId) {
        PlayerShip ship = requireOwnedShip(shipId, playerId);
        SmugglingOfferDTO offer = ship.getPendingSmugglingOffer();
        if (offer == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending smuggling offer for this ship.");
        }

        CargoContract contract = new CargoContract(
                ship.getSessionId(),
                offer.getDescription(),
                offer.getReward(),
                offer.getRequiredCapacity(),
                offer.getOriginPortId(),
                offer.getDestinationPortId(),
                offer.getRiskLevel()
        );
        contract.setIllegal(true);
        contract.setStatus(CargoStatus.ACCEPTED);
        contract.setAssignedShipId(shipId);
        // No expiresAtTick — smuggling cargo is one-shot.
        cargoContractRepository.save(contract);

        ship.setPendingSmugglingOffer(null);
        // Leave pendingRouteDestinationPortId — the caller (ShipService) consumes & clears it.
        playerShipRepository.save(ship);

        log.info("Smuggling offer accepted by player {} on ship {} (contract {})",
                playerId, shipId, contract.getId());
        return contract.getId();
    }

    @Override
    @Transactional
    public void rejectOffer(String shipId, String playerId) {
        PlayerShip ship = requireOwnedShip(shipId, playerId);
        if (ship.getPendingSmugglingOffer() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pending smuggling offer for this ship.");
        }
        ship.setPendingSmugglingOffer(null);
        playerShipRepository.save(ship);
        log.info("Smuggling offer rejected by player {} on ship {}", playerId, shipId);
    }

    private PlayerShip requireOwnedShip(String shipId, String playerId) {
        return playerShipRepository.findByIdAndPlayerId(shipId, playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not found or not owned by player"));
    }

    private record OfferTemplate(String description, int minReward, int maxReward,
                                 int minCapacity, int maxCapacity) {}
}