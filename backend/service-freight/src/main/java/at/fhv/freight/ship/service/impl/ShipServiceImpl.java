package at.fhv.freight.ship.service.impl;

import at.fhv.freight.dto.BuyShipRequestDTO;
import at.fhv.freight.dto.CargoContractDTO;
import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.CreateShipRequestDTO;
import at.fhv.freight.dto.CustomsStatus;
import at.fhv.freight.dto.FleetShipDTO;
import at.fhv.freight.dto.HirePilotResponseDTO;
import at.fhv.freight.dto.MarketShipDTO;
import at.fhv.freight.dto.MinigameEventMessageDTO;
import at.fhv.freight.dto.NavigateSelfResponseDTO;
import at.fhv.freight.dto.OverboardResultRequestDTO;
import at.fhv.freight.dto.OverboardResultResponseDTO;
import at.fhv.freight.dto.PilotRequestMessageDTO;
import at.fhv.freight.dto.PlayerDTO;
import at.fhv.freight.dto.PortDTO;
import at.fhv.freight.dto.RefuelResponseDTO;
import at.fhv.freight.dto.RepairResponseDTO;
import at.fhv.freight.dto.RouteDTO;
import at.fhv.freight.dto.SessionTickResultDTO;
import at.fhv.freight.dto.ShipArrivalDTO;
import at.fhv.freight.dto.ShipClass;
import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.dto.StartRouteRequestDTO;
import at.fhv.freight.dto.StartRouteResponseDTO;
import at.fhv.freight.dto.WaypointDTO;
import at.fhv.freight.dto.WaypointUpdateDTO;
import at.fhv.freight.cargo.model.CargoContract;
import at.fhv.freight.cargo.repository.CargoContractRepository;
import at.fhv.freight.client.PilotStrikeClient;
import at.fhv.freight.client.PlayerClient;
import at.fhv.freight.customs.service.CustomsService;
import at.fhv.freight.dto.SmugglingOfferDTO;
import at.fhv.freight.smuggling.service.SmugglingService;
import at.fhv.freight.client.PortClient;
import at.fhv.freight.client.RouteClient;
import at.fhv.freight.ship.model.MarketShip;
import at.fhv.freight.ship.model.PlayerShip;
import at.fhv.freight.ship.model.Waypoint;
import at.fhv.freight.ship.repository.MarketShipRepository;
import at.fhv.freight.ship.repository.PlayerShipRepository;
import at.fhv.freight.dto.SellShipResponseDTO;
import at.fhv.freight.ship.service.SellPriceCalculator;
import at.fhv.freight.ship.service.ShipNotFoundException;
import at.fhv.freight.ship.service.ShipService;
import at.fhv.freight.ship.service.ShipClassConfig;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ShipServiceImpl implements ShipService {

    private static final Logger log = LoggerFactory.getLogger(ShipServiceImpl.class);

    private static final int REFUEL_COST_PER_UNIT = 10;
    private static final int PILOT_HIRE_COST = 500;
    private static final int REPAIR_COST_PER_HP = 125;
    private static final int MIN_HP_TO_SAIL = 20;

    private static final int FULL_TANK = 100;


    private static final double MAN_OVERBOARD_CHANCE = 0.14;
    private static final double ROCKS_CHANCE         = 0.14;
    private static final double RATS_CHANCE          = 0.10;

    private static final int OVERBOARD_FAIL_HP_PENALTY_MIN = 8;
    private static final int OVERBOARD_FAIL_HP_PENALTY_MAX = 18;


    private static final int RATS_DAMAGE_PER_TICK_PERCENT = 2;
    private static final int RATS_MAX_DAMAGE_PERCENT = 50;
    private static final int RATS_FAILURE_EXTRA_LOSS_PERCENT = 20;
    private static final int RATS_CABLES_HP_PER_TICK = 1;
    private static final int RATS_CABLES_FAILURE_EXTRA_HP = 15;
    private static final String RATS_MODE_CARGO = "CARGO";
    private static final String RATS_MODE_CABLES = "CABLES";

    private final MarketShipRepository marketShipRepository;
    private final PlayerShipRepository playerShipRepository;
    private final CargoContractRepository cargoContractRepository;
    private final PlayerClient playerClient;
    private final RouteClient routeClient;
    private final PortClient portClient;
    private final CustomsService customsService;
    private final SmugglingService smugglingService;
    private final SellPriceCalculator sellPriceCalculator;
    private final PilotStrikeClient pilotStrikeClient;
    private final ShipClassConfig shipClassConfig;

    public ShipServiceImpl(MarketShipRepository marketShipRepository,
                           PlayerShipRepository playerShipRepository,
                           CargoContractRepository cargoContractRepository,
                           PlayerClient playerClient,
                           RouteClient routeClient,
                           PortClient portClient,
                           CustomsService customsService,
                           SmugglingService smugglingService,
                           SellPriceCalculator sellPriceCalculator,
                           PilotStrikeClient pilotStrikeClient,
                           ShipClassConfig shipClassConfig) {
        this.marketShipRepository = marketShipRepository;
        this.playerShipRepository = playerShipRepository;
        this.cargoContractRepository = cargoContractRepository;
        this.playerClient = playerClient;
        this.routeClient = routeClient;
        this.portClient = portClient;
        this.customsService = customsService;
        this.smugglingService = smugglingService;
        this.sellPriceCalculator = sellPriceCalculator;
        this.pilotStrikeClient = pilotStrikeClient;
        this.shipClassConfig = shipClassConfig;
    }

    // Market

    @Override
    public List<MarketShipDTO> getMarketShips() {
        return marketShipRepository.findAll().stream()
                .map(this::toMarketDto)
                .toList();
    }

    @Override
    @Transactional
    public MarketShipDTO addMarketShip(CreateShipRequestDTO request) {
        int health = request.getHealthPoints() != null ? request.getHealthPoints() : 100;
        boolean used = request.getIsUsed() != null && request.getIsUsed();
        int capacity = request.getCapacity() > 0 ? request.getCapacity() : 100;
        int fuelConsumption = defaultFuelConsumption(request.getShipClass());
        MarketShip ship = new MarketShip(
                request.getName(), request.getShipClass(), request.getPrice(),
                request.getDescription(), capacity, health, fuelConsumption, used);
        return toMarketDto(marketShipRepository.save(ship));
    }

    @Override
    @Transactional
    public void buyShip(BuyShipRequestDTO request) {
        MarketShip market = marketShipRepository.findById(request.getShipId())
                .orElseThrow(() -> new ShipNotFoundException("Market ship not found: " + request.getShipId()));

        PlayerDTO player = playerClient.getPlayer(request.getPlayerId());

        if (player.getCurrentPortId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Player has no home port – please select a home port first");
        }
        if (player.getMoney() < market.getPrice()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough money");
        }

        playerClient.updateMoney(request.getPlayerId(), -market.getPrice());

        String shipName = (request.getShipName() != null && !request.getShipName().isBlank())
                ? request.getShipName().trim()
                : market.getName();

        PlayerShip owned = new PlayerShip();
        owned.setPlayerId(player.getId());
        owned.setSessionId(player.getSessionId());
        owned.setName(shipName);
        owned.setShipClass(market.getShipClass());
        owned.setPrice(market.getPrice());
        owned.setDescription(market.getDescription());
        owned.setCapacity(market.getCapacity());
        owned.setUsed(market.isUsed());
        owned.setStatus(ShipStatus.IDLE);
        owned.setCurrentPortId(player.getCurrentPortId());
        owned.setFuelLevel(100);
        owned.setHealthPoints(market.getHealthPoints());
        owned.setMaxHealthPoints(100);
        owned.setFuelConsumptionPerTick(
                market.getFuelConsumptionPerTick() > 0
                        ? market.getFuelConsumptionPerTick()
                        : defaultFuelConsumption(market.getShipClass()));

        try {
            owned = playerShipRepository.save(owned);
        } catch (Exception e) {
            refund(request.getPlayerId(), market.getPrice(), "buyShip");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Ship registration failed. Payment has been refunded.");
        }

        playerClient.updateCurrentShip(player.getId(), owned.getId());
    }

    @Override
    @Transactional
    public SellShipResponseDTO sellShip(String playerId, String shipId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);

        // Business rules
        if (ship.getStatus() == ShipStatus.SEIZED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ship has been repossessed by the bank and cannot be sold.");
        }
        if (ship.isMortgaged()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is mortgaged — pay off the mortgage at the bank before selling.");
        }
        requireDocked(ship, "sell");
        boolean hasActiveCargo = !cargoContractRepository
                .findByAssignedShipIdAndStatus(ship.getId(), CargoStatus.ACCEPTED)
                .isEmpty();
        if (hasActiveCargo) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Unload the ship's cargo before selling it.");
        }

        int salePrice = sellPriceCalculator.calculateSellPrice(ship);

        // Credit the seller
        PlayerDTO updated = playerClient.updateMoney(playerId, salePrice);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "player-service did not confirm the sale proceeds");
        }

        // Relist as USED and remove from the fleet
        String marketShipId;
        try {
            MarketShip relisted = new MarketShip(
                    ship.getName(),
                    ship.getShipClass(),
                    sellPriceCalculator.usedMarketPrice(ship.getPrice(), ship.getHealthPoints()),
                    ship.getDescription(),
                    ship.getCapacity(),
                    ship.getHealthPoints(),
                    ship.getFuelConsumptionPerTick(),
                    true);
            marketShipId = marketShipRepository.save(relisted).getId();
            playerShipRepository.delete(ship);
        } catch (Exception e) {
            refund(playerId, -salePrice, "sellShip");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Sale failed. The proceeds have been reversed.");
        }

        // Clear the player's current-ship marker if it pointed at the sold ship.
        if (shipId.equals(updated.getCurrentShipId())) {
            playerClient.updateCurrentShip(playerId, null);
        }

        log.info("Player {} sold ship {} for {} (relisted as used {})",
                playerId, shipId, salePrice, marketShipId);

        return new SellShipResponseDTO(shipId, salePrice, updated.getMoney(), marketShipId);
    }

    // Fleet
    @Override
    public List<FleetShipDTO> getPlayerFleet(String playerId) {
        return playerShipRepository.findAllByPlayerId(playerId).stream()
                .map(this::toFleetDto)
                .toList();
    }

    @Override
    public List<FleetShipDTO> getShipsAtPort(String portId, String playerId) {
        return playerShipRepository.findAllByPlayerIdAndCurrentPortId(playerId, portId).stream()
                .map(this::toFleetDto)
                .toList();
    }

    @Override
    public FleetShipDTO getShip(String shipId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));
        return toFleetDto(ship);
    }

    @Override
    @Transactional
    public void deleteAllShipsOfPlayer(String playerId) {
        playerShipRepository.deleteAll(playerShipRepository.findAllByPlayerId(playerId));
    }

    @Override
    @Transactional
    public void deleteAllShipsOfSession(String sessionId) {
        playerShipRepository.deleteAll(playerShipRepository.findAllBySessionId(sessionId));
    }

    // Operations

    @Override
    @Transactional
    public RefuelResponseDTO refuelShip(String playerId, String shipId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);
        requireDocked(ship, "refuel");

        int missingFuel = Math.max(0, 100 - ship.getFuelLevel());
        if (missingFuel == 0) {
            PlayerDTO p = playerClient.getPlayer(playerId);
            return new RefuelResponseDTO(ship.getFuelLevel(), p != null ? p.getMoney() : 0, 0);
        }

        int cost = missingFuel * REFUEL_COST_PER_UNIT;

        PlayerDTO updated = playerClient.updateMoney(playerId, -cost);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "player-service did not confirm the fuel charge");
        }

        try {
            ship.setFuelLevel(100);
            playerShipRepository.save(ship);
        } catch (Exception e) {
            refund(playerId, cost, "refuelShip");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fuel update failed. Payment has been refunded.");
        }

        return new RefuelResponseDTO(ship.getFuelLevel(), updated.getMoney(), cost);
    }

    @Override
    @Transactional
    public RepairResponseDTO repairShip(String playerId, String shipId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);
        requireDocked(ship, "repair");

        int maxHp = ship.getMaxHealthPoints();

        if (ship.getHealthPoints() >= maxHp) {
            PlayerDTO p = playerClient.getPlayer(playerId);
            return new RepairResponseDTO(ship.getHealthPoints(), p != null ? p.getMoney() : 0, 0);
        }

        int missingHp = maxHp - ship.getHealthPoints();
        int cost = missingHp * REPAIR_COST_PER_HP;

        PlayerDTO updated = playerClient.updateMoney(playerId, -cost);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "player-service did not confirm the repair charge");
        }

        try {
            ship.setHealthPoints(maxHp);
            playerShipRepository.save(ship);
        } catch (Exception e) {
            refund(playerId, cost, "repairShip");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Repair update failed. Payment has been refunded.");
        }

        return new RepairResponseDTO(ship.getHealthPoints(), updated.getMoney(), cost);
    }

    @Override
    @Transactional
    public HirePilotResponseDTO hirePilot(String playerId, String shipId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);

        if (ship.getStatus() != ShipStatus.IDLE && ship.getStatus() != ShipStatus.AWAITING_PILOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship must be docked or approaching harbor to hire pilot");
        }
        if (ship.isHasPilot()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ship already has a pilot");
        }

        if (pilotStrikeClient.isStriking(ship.getDestinationPortId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Harbour pilots are on strike at the destination port — you must dock manually.");
        }

        PlayerDTO updated = playerClient.updateMoney(playerId, -PILOT_HIRE_COST);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "player-service did not confirm the pilot hire charge");
        }

        try {
            ship.setHasPilot(true);
            if (ship.getStatus() == ShipStatus.AWAITING_PILOT) {
                ship.setStatus(ShipStatus.IN_TRANSIT);
            }
            playerShipRepository.save(ship);
        } catch (Exception e) {
            refund(playerId, PILOT_HIRE_COST, "hirePilot");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Pilot hire failed. Payment has been refunded.");
        }

        return new HirePilotResponseDTO(true, updated.getMoney(), PILOT_HIRE_COST);
    }

    @Override
    @Transactional
    public NavigateSelfResponseDTO navigateSelf(String playerId, String shipId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);
        if (ship.getStatus() != ShipStatus.AWAITING_PILOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is not awaiting a pilot decision");
        }
        return new NavigateSelfResponseDTO(ship.getId(), ship.getStatus().name());
    }

    @Override
    @Transactional
    public at.fhv.freight.dto.ParkingResultResponseDTO submitParkingResult(
            at.fhv.freight.dto.ParkingResultRequestDTO request) {

        PlayerShip ship = requireOwnedShip(request.getPlayerId(), request.getShipId());
        if (ship.getStatus() != ShipStatus.AWAITING_PILOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is not in a state where parking result can be submitted");
        }

        int damageApplied = 0;

        if (!request.isSuccess()) {
            damageApplied = 15;
            int newHp = Math.max(0, ship.getHealthPoints() - damageApplied);
            ship.setHealthPoints(newHp);
        }

        ship.setStatus(ShipStatus.IN_TRANSIT);
        playerShipRepository.save(ship);

        String message = request.isSuccess()
                ? "Well steered! Ship docked without a pilot."
                : "Rough docking! Ship took " + damageApplied + " HP damage.";

        return new at.fhv.freight.dto.ParkingResultResponseDTO(
                ship.getId(), request.isSuccess(), message, damageApplied, ship.getHealthPoints());
    }

    @Override
    @Transactional
    public StartRouteResponseDTO startRoute(StartRouteRequestDTO request) {
        if (request.getShipId() == null || request.getShipId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ship ID is required");
        }

        PlayerShip ship = requireOwnedShip(request.getPlayerId(), request.getShipId());
        validateCanStartRoute(ship, request.getDestinationPortId());

        SmugglingOfferDTO offer = smugglingService.maybeGenerateOffer(ship, request.getDestinationPortId());
        if (offer != null) {
            String destName = portClient.getPortName(request.getDestinationPortId());
            return StartRouteResponseDTO.pendingOffer(offer, destName);
        }

        return executeRoute(ship, request.getDestinationPortId(), request.getPlayerId());
    }

    @Override
    @Transactional
    public StartRouteResponseDTO resumeRouteAfterSmugglingDecision(String shipId, String playerId) {
        PlayerShip ship = requireOwnedShip(playerId, shipId);
        if (ship.getPendingSmugglingOffer() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Smuggling offer still pending — accept or reject it first.");
        }
        String destinationPortId = ship.getPendingRouteDestinationPortId();
        if (destinationPortId == null || destinationPortId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No pending route destination found for this ship.");
        }
        validateCanStartRoute(ship, destinationPortId);
        ship.setPendingRouteDestinationPortId(null);
        return executeRoute(ship, destinationPortId, playerId);
    }

    private void validateCanStartRoute(PlayerShip ship, String destinationPortId) {
        if (ship.getStatus() == ShipStatus.SEIZED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This ship has been repossessed by the bank and can no longer set sail.");
        }
        if (ship.getStatus() == ShipStatus.IN_TRANSIT
                || ship.getStatus() == ShipStatus.AWAITING_PILOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is already underway – wait for arrival before starting a new route");
        }
        if (ship.getStatus() == ShipStatus.CUSTOMS_HOLD) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is held in customs — cannot set sail");
        }
        if (ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customs inspection pending — resolve it before setting sail");
        }
        if (ship.getCurrentPortId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ship is not docked at any port");
        }
        if (ship.getCurrentPortId().equals(destinationPortId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Destination is the same as the current port");
        }
        if (ship.getHealthPoints() < MIN_HP_TO_SAIL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is too damaged to set sail (HP: " + ship.getHealthPoints()
                            + "/100). Repair the ship first!");
        }
    }

    private StartRouteResponseDTO executeRoute(PlayerShip ship, String destinationPortId, String playerId) {
        RouteDTO route = routeClient.findRoute(ship.getCurrentPortId(), destinationPortId);

        List<WaypointDTO> waypoints;
        int totalTicks;
        boolean usingAlternative = false;
        if (route.isBlocked()) {
            if (route.shouldUseAlternative()) {
                waypoints  = route.getAlternativeWaypoints();
                totalTicks = route.getAlternativeTotalTicks() != null
                        ? route.getAlternativeTotalTicks()
                        : waypoints.size() - 1;
                usingAlternative = true;
            } else {
                String headline = route.getBlockReason() != null
                        ? route.getBlockReason()
                        : "This route is currently blocked";
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        headline + " — pick a different destination.");
            }
        } else {
            waypoints  = route.getWaypoints();
            totalTicks = route.getTotalTicks();
        }

        if (usingAlternative) {
            if (ship.getFuelLevel() < FULL_TANK) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The detour around the blockade needs a full main tank plus a "
                                + "reserve — top up to a full tank before departing.");
            }

            double routeLength = polylineLength(waypoints);
            int fuelPer100 = shipClassConfig.fuelPer100(ship.getShipClass());
            int totalFuel = (int) Math.ceil(routeLength * fuelPer100 / 100.0);
            int reserveNeeded = Math.max(0, totalFuel - FULL_TANK);
            int reserveCost = reserveNeeded * REFUEL_COST_PER_UNIT;
            if (reserveCost > 0) {
                PlayerDTO paid = playerClient.updateMoney(playerId, -reserveCost);
                if (paid == null) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Not enough money for the reserve fuel (" + reserveNeeded
                                    + " units = " + reserveCost + " Taler) needed for this detour.");
                }
            }
            ship.setReserveFuel(reserveNeeded);
            ship.setReserveFuelCapacity(reserveNeeded);
        } else {
            double routeLength = polylineLength(waypoints);
            int fuelPer100 = shipClassConfig.fuelPer100(ship.getShipClass());
            int requiredFuel = (int) Math.ceil(routeLength * fuelPer100 / 100.0);
            if (ship.getFuelLevel() < requiredFuel) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Not enough fuel to start this voyage. Required: " + requiredFuel
                                + " units (range too short — refuel or pick a closer port).");
            }
            ship.setReserveFuel(0);
            ship.setReserveFuelCapacity(0);
        }

        ship.setActiveRouteId(route.getId());
        ship.setCurrentWaypointIndex(0);
        ship.setRouteProgress(0.0);
        ship.setDestinationPortId(destinationPortId);
        ship.setRouteTotalTicks(totalTicks);
        ship.setMinigameDoneThisVoyage(false);
        ship.setUsingAlternativeRoute(usingAlternative);
        ship.setStatus(ShipStatus.IN_TRANSIT);
        ship.setActiveRouteWaypoints(waypoints.stream()
                .map(this::toWaypoint)
                .toList());

        playerShipRepository.save(ship);

        if (!waypoints.isEmpty()) {
            WaypointDTO start = waypoints.get(0);
            playerClient.updatePosition(playerId, start.getX(), start.getY());
        }
        playerClient.updateCurrentShip(playerId, ship.getId());

        PortDTO destination = portClient.getPort(destinationPortId);
        String destName = destination != null ? destination.getName() : "Unknown";
        return new StartRouteResponseDTO(route.getId(), totalTicks,
                destinationPortId, destName);
    }

    @Override
    @Transactional
    public void moveShip(String shipId, String newPortId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));
        ship.setCurrentPortId(newPortId);
        playerShipRepository.save(ship);
    }

    @Override
    @Transactional
    public FleetShipDTO updateStatus(String shipId, ShipStatus status) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));
        ship.setStatus(status);
        return toFleetDto(playerShipRepository.save(ship));
    }

    @Override
    @Transactional
    public FleetShipDTO setMortgaged(String shipId, boolean mortgaged) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));
        ship.setMortgaged(mortgaged);
        return toFleetDto(playerShipRepository.save(ship));
    }

    @Override
    @Transactional
    public FleetShipDTO seizeShip(String shipId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));
        ship.setStatus(ShipStatus.SEIZED);
        ship.setMortgaged(true);
        ship.setActiveRouteId(null);
        ship.setActiveRouteWaypoints(null);
        ship.setDestinationPortId(null);
        ship.setRouteTotalTicks(null);
        ship.setRouteProgress(0.0);
        ship.setUsingAlternativeRoute(false);
        ship.setReserveFuel(0);
        ship.setReserveFuelCapacity(0);
        ship.setHasPilot(false);
        log.info("Ship {} (player {}) SEIZED by the bank", shipId, ship.getPlayerId());
        return toFleetDto(playerShipRepository.save(ship));
    }

    @Override
    @Transactional
    public void startMinigame(String shipId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));

        if (ship.getStatus() != ShipStatus.MINIGAME_WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ship is not waiting for a minigame");
        }

        ship.setStatus(ShipStatus.MINIGAME_ACTIVE);
        playerShipRepository.save(ship);
    }

    @Override
    @Transactional
    public void finishMinigame(String shipId) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));

        if (ship.getStatus() != ShipStatus.MINIGAME_ACTIVE && ship.getStatus() != ShipStatus.MINIGAME_WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ship is not in a minigame");
        }

        int damage = ThreadLocalRandom.current().nextInt(11) + 10; // 10–20 HP damage for aborting
        ship.setHealthPoints(Math.max(0, ship.getHealthPoints() - damage));
        ship.setStatus(ShipStatus.IN_TRANSIT);
        playerShipRepository.save(ship);
    }

    @Override
    @Transactional
    public OverboardResultResponseDTO finishOverboardMinigame(String shipId, OverboardResultRequestDTO request) {
        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));

        if (ship.getStatus() != ShipStatus.MINIGAME_ACTIVE && ship.getStatus() != ShipStatus.MINIGAME_WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ship is not in a minigame");
        }

        boolean success = request != null && request.isSuccess();
        int hpPenalty = 0;

        if (!success) {
            hpPenalty = ThreadLocalRandom.current().nextInt(
                    OVERBOARD_FAIL_HP_PENALTY_MAX - OVERBOARD_FAIL_HP_PENALTY_MIN + 1)
                    + OVERBOARD_FAIL_HP_PENALTY_MIN;
            ship.setHealthPoints(Math.max(0, ship.getHealthPoints() - hpPenalty));
        }

        ship.setStatus(ShipStatus.IN_TRANSIT);
        playerShipRepository.save(ship);

        log.info("Man-overboard rescue finished: ship={} success={} rescueTimeMs={} hpPenalty={}",
                shipId, success, request != null ? request.getRescueTimeMs() : 0, hpPenalty);

        return new OverboardResultResponseDTO(
                ship.getId(), success, hpPenalty, ship.getHealthPoints(), ship.getStatus());
    }

    // Tick processing

    @Override
    public List<FleetShipDTO> getAllShipsOfSession(String sessionId) {
        return playerShipRepository.findAllBySessionId(sessionId).stream()
                .map(this::toFleetDto)
                .toList();
    }

    @Override
    @Transactional
    public SessionTickResultDTO processTickForSession(String sessionId, int currentTick) {
        List<ShipArrivalDTO> arrivals = new ArrayList<>();
        List<WaypointUpdateDTO> waypointUpdates = new ArrayList<>();
        List<PilotRequestMessageDTO> pilotRequests = new ArrayList<>();
        List<MinigameEventMessageDTO> minigameEvents = new ArrayList<>();

        for (PlayerShip ship : playerShipRepository.findAllBySessionId(sessionId)) {

            boolean underCustomsControl = ship.getStatus() == ShipStatus.CUSTOMS_HOLD
                    || ship.getCustomsStatus() != CustomsStatus.NONE;
            boolean hasCargo = !cargoContractRepository
                    .findByAssignedShipIdAndStatus(ship.getId(), CargoStatus.ACCEPTED)
                    .isEmpty();
            boolean ratsDamageEligible = !underCustomsControl && (
                    hasCargo && (ship.getStatus() == ShipStatus.IN_TRANSIT || ship.getStatus() == ShipStatus.IDLE)
                            || !hasCargo && ship.getStatus() == ShipStatus.IN_TRANSIT);

            if (ship.isRatsActive()
                    && ratsDamageEligible
                    && ship.getRatsTicks() < RATS_MAX_DAMAGE_PERCENT / RATS_DAMAGE_PER_TICK_PERCENT) {
                applyRatsTickDamage(ship);
                ship.setRatsTicks(ship.getRatsTicks() + 1);
                playerShipRepository.save(ship);
            }

            if (ship.getStatus() == ShipStatus.CUSTOMS_HOLD) continue;

            if (ship.getStatus() == ShipStatus.LOADING) {
                ship.setStatus(ShipStatus.LOADED);
                playerShipRepository.save(ship);
                continue;
            }

            if (ship.getStatus() == ShipStatus.AWAITING_PILOT) continue;
            if (ship.getStatus() == ShipStatus.MINIGAME_WAITING || ship.getStatus() == ShipStatus.MINIGAME_ACTIVE) continue;
            if (ship.getStatus() != ShipStatus.IN_TRANSIT) continue;
            if (ship.getActiveRouteId() == null
                    || ship.getActiveRouteWaypoints() == null
                    || ship.getActiveRouteWaypoints().isEmpty()) continue;

            // Distance-based movement

            List<Waypoint> wps = ship.getActiveRouteWaypoints();
            double[] cum = cumulativeLengths(wps);
            double totalLen = cum[cum.length - 1];

            double speed = shipClassConfig.baseSpeedPerTick(ship.getShipClass())
                    * shipSpeedFactor(ship.getId());
            double prev = ship.getRouteProgress();
            double next = prev + speed;

            // Pilot point = the second-to-last waypoint (its distance).
            double pilotDist = wps.size() >= 2 ? cum[wps.size() - 2] : totalLen;
            double midDist = totalLen / 2.0;

            // Midpoint event roll (crossing the half-distance)
            boolean atMidpoint = wps.size() >= 3
                    && midDist < pilotDist
                    && prev < midDist && next >= midDist;
            if (!ship.isMinigameDoneThisVoyage() && !ship.isRatsActive() && atMidpoint) {
                ship.setMinigameDoneThisVoyage(true);

                double roll = ThreadLocalRandom.current().nextDouble();

                if (roll < MAN_OVERBOARD_CHANCE) {
                    // Blocking minigame — the ship stops and waits for the player.
                    ship.setStatus(ShipStatus.MINIGAME_WAITING);
                    playerShipRepository.save(ship);
                    minigameEvents.add(new MinigameEventMessageDTO(
                            sessionId, ship.getId(), ship.getPlayerId(), "MAN_OVERBOARD"));
                    continue;
                } else if (roll < MAN_OVERBOARD_CHANCE + ROCKS_CHANCE) {
                    ship.setStatus(ShipStatus.MINIGAME_WAITING);
                    playerShipRepository.save(ship);
                    minigameEvents.add(new MinigameEventMessageDTO(
                            sessionId, ship.getId(), ship.getPlayerId(), "ROCKS"));
                    continue;
                } else if (roll < MAN_OVERBOARD_CHANCE + ROCKS_CHANCE + RATS_CHANCE) {

                    String mode = hasCargo ? RATS_MODE_CARGO : RATS_MODE_CABLES;
                    ship.setRatsActive(true);
                    ship.setRatsTicks(0);
                    ship.setRatsMode(mode);
                    playerShipRepository.save(ship);
                    minigameEvents.add(new MinigameEventMessageDTO(
                            sessionId, ship.getId(), ship.getPlayerId(), "RATS_ON_BOARD", mode));
                } else {

                    playerShipRepository.save(ship);
                }
            }


            boolean mustRequestPilot = !ship.isHasPilot()
                    && pilotDist > 0 && prev < pilotDist && next >= pilotDist;

            if (mustRequestPilot) {
                burnFuel(ship, pilotDist - prev);
                ship.setRouteProgress(pilotDist);
                ship.setCurrentWaypointIndex(indexAtDistance(cum, pilotDist));
                ship.setStatus(ShipStatus.AWAITING_PILOT);
                playerShipRepository.save(ship);

                pilotRequests.add(new PilotRequestMessageDTO(
                        ship.getPlayerId(), ship.getId(), ship.getDestinationPortId()));

                int[] xy = pointAtDistance(wps, cum, pilotDist);
                waypointUpdates.add(new WaypointUpdateDTO(
                        ship.getId(), ship.getPlayerId(), xy[0], xy[1]));

            } else if (next >= totalLen) {
                burnFuel(ship, totalLen - prev);

                String destinationPortId = ship.getDestinationPortId();
                Waypoint last = wps.get(wps.size() - 1);
                int destX = last.getX(), destY = last.getY();

                int voyageWear = ThreadLocalRandom.current().nextInt(5) + 1;
                ship.setHealthPoints(Math.max(0, ship.getHealthPoints() - voyageWear));

                ship.setCurrentPortId(destinationPortId);
                ship.setStatus(ShipStatus.IDLE);
                ship.setActiveRouteId(null);
                ship.setCurrentWaypointIndex(0);
                ship.setRouteProgress(0.0);
                ship.setDestinationPortId(null);
                ship.setRouteTotalTicks(null);
                ship.setActiveRouteWaypoints(null);
                ship.setMinigameDoneThisVoyage(false);
                ship.setUsingAlternativeRoute(false);
                ship.setReserveFuel(0);
                ship.setReserveFuelCapacity(0);
                if (ship.isHasPilot()) {
                    ship.setHasPilot(false);
                }
                playerShipRepository.save(ship);

                customsService.triggerIfApplicable(ship);

                arrivals.add(new ShipArrivalDTO(
                        ship.getId(), ship.getPlayerId(), destinationPortId, destX, destY));

            } else {

                burnFuel(ship, speed);
                ship.setRouteProgress(next);
                ship.setCurrentWaypointIndex(indexAtDistance(cum, next));
                playerShipRepository.save(ship);

                int[] xy = pointAtDistance(wps, cum, next);
                waypointUpdates.add(new WaypointUpdateDTO(
                        ship.getId(), ship.getPlayerId(), xy[0], xy[1]));
            }
        }

        customsService.processHoldTick(sessionId);

        return new SessionTickResultDTO(arrivals, waypointUpdates, pilotRequests, minigameEvents);
    }

    // Rats-on-board

    @Override
    @Transactional
    public at.fhv.freight.dto.RatsResultResponseDTO finishRatsMinigame(
            String shipId, at.fhv.freight.dto.RatsResultRequestDTO request) {

        PlayerShip ship = playerShipRepository.findById(shipId)
                .orElseThrow(() -> new ShipNotFoundException("Ship not found: " + shipId));

        if (!ship.isRatsActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship has no active rats infestation");
        }
        if (ship.getStatus() == ShipStatus.CUSTOMS_HOLD
                || ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is under customs control — minigames are blocked.");
        }

        boolean cablesMode = RATS_MODE_CABLES.equals(ship.getRatsMode());
        int extraLoss = 0;
        int totalDamage;
        String message;

        if (cablesMode) {
            int hpLostSoFar = ship.getRatsTicks() * RATS_CABLES_HP_PER_TICK;
            if (!request.isSuccess()) {
                extraLoss = RATS_CABLES_FAILURE_EXTRA_HP;
                ship.setHealthPoints(Math.max(0, ship.getHealthPoints() - extraLoss));
            }
            totalDamage = hpLostSoFar + extraLoss;
            message = request.isSuccess()
                    ? "Cables secured. The rats are off your ship."
                    : "The rats chewed through " + extraLoss + " more HP of wiring before fleeing.";
        } else {
            int cargoLossSoFar = ship.getRatsTicks() * RATS_DAMAGE_PER_TICK_PERCENT;
            if (!request.isSuccess()) {
                extraLoss = RATS_FAILURE_EXTRA_LOSS_PERCENT;
                applyCargoLossPercent(ship.getId(), extraLoss);
            }
            totalDamage = Math.min(100, cargoLossSoFar + extraLoss);
            message = request.isSuccess()
                    ? "The cargo hold is clear of rats."
                    : "The rats ate through " + extraLoss + "% of your cargo value before fleeing.";
        }

        String mode = cablesMode ? RATS_MODE_CABLES : RATS_MODE_CARGO;
        ship.setRatsActive(false);
        ship.setRatsTicks(0);
        ship.setRatsMode(null);
        playerShipRepository.save(ship);

        return new at.fhv.freight.dto.RatsResultResponseDTO(
                ship.getId(), request.isSuccess(), extraLoss, totalDamage, message, mode);
    }

    private void applyRatsTickDamage(PlayerShip ship) {
        if (RATS_MODE_CABLES.equals(ship.getRatsMode())) {
            ship.setHealthPoints(Math.max(0, ship.getHealthPoints() - RATS_CABLES_HP_PER_TICK));
        } else {
            applyCargoLossPercent(ship.getId(), RATS_DAMAGE_PER_TICK_PERCENT);
        }
    }

    private void applyCargoLossPercent(String shipId, int percent) {
        if (percent <= 0) return;
        List<CargoContract> cargos = cargoContractRepository
                .findByAssignedShipIdAndStatus(shipId, CargoStatus.ACCEPTED);
        for (CargoContract c : cargos) {
            int before = c.getReward();
            int reduced = Math.max(0, (int) Math.round(before * (1.0 - percent / 100.0)));
            int loss = before - reduced;
            if (loss > 0) {
                c.setReward(reduced);
                c.setRatsValueLoss(c.getRatsValueLoss() + loss);
                cargoContractRepository.save(c);
            }
        }
    }

    // Internal helpers

    private PlayerShip requireOwnedShip(String playerId, String shipId) {
        return playerShipRepository.findByIdAndPlayerId(shipId, playerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ship not owned by player"));
    }

    private void requireDocked(PlayerShip ship, String action) {
        ShipStatus s = ship.getStatus();
        if (s == ShipStatus.CUSTOMS_HOLD) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship is held in customs and cannot " + action);
        }
        if (ship.getCustomsStatus() != CustomsStatus.NONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customs inspection pending — resolve it before you can " + action);
        }
        if (s != ShipStatus.IDLE && s != ShipStatus.LOADING && s != ShipStatus.LOADED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ship must be docked to " + action);
        }
    }

    private void refund(String playerId, int amount, String context) {
        try {
            playerClient.updateMoney(playerId, amount);
        } catch (Exception ex) {
            log.error("CRITICAL: refund of {} for player {} failed in {} – manual intervention required",
                    amount, playerId, context, ex);
        }
    }

    private int defaultFuelConsumption(ShipClass cls) {
        return shipClassConfig.fuelPer100(cls);
    }

    // distance-based movement helpers

    private static double shipSpeedFactor(String shipId) {
        if (shipId == null) return 1.0;
        return 0.93 + (Math.abs(shipId.hashCode()) % 15) / 100.0;
    }

    private static double[] cumulativeLengths(List<Waypoint> wps) {
        double[] cum = new double[wps.size()];
        for (int i = 1; i < wps.size(); i++) {
            double dx = wps.get(i).getX() - wps.get(i - 1).getX();
            double dy = wps.get(i).getY() - wps.get(i - 1).getY();
            cum[i] = cum[i - 1] + Math.hypot(dx, dy);
        }
        return cum;
    }

    private static double polylineLength(List<WaypointDTO> wps) {
        double total = 0;
        for (int i = 1; i < wps.size(); i++) {
            double dx = wps.get(i).getX() - wps.get(i - 1).getX();
            double dy = wps.get(i).getY() - wps.get(i - 1).getY();
            total += Math.hypot(dx, dy);
        }
        return total;
    }

    private static int indexAtDistance(double[] cum, double dist) {
        int idx = 0;
        for (int i = 0; i < cum.length; i++) {
            if (cum[i] <= dist) idx = i; else break;
        }
        return idx;
    }

    private static int[] pointAtDistance(List<Waypoint> wps, double[] cum, double dist) {
        double total = cum[cum.length - 1];
        if (dist <= 0)      return new int[]{ wps.get(0).getX(), wps.get(0).getY() };
        if (dist >= total)  { Waypoint l = wps.get(wps.size() - 1); return new int[]{ l.getX(), l.getY() }; }
        int i = indexAtDistance(cum, dist);
        double segLen = cum[i + 1] - cum[i];
        double t = segLen > 0 ? (dist - cum[i]) / segLen : 0;
        Waypoint a = wps.get(i), b = wps.get(i + 1);
        return new int[]{
                (int) Math.round(a.getX() + (b.getX() - a.getX()) * t),
                (int) Math.round(a.getY() + (b.getY() - a.getY()) * t),
        };
    }

    private void burnFuel(PlayerShip ship, double distance) {
        if (distance <= 0) return;
        int burn = (int) Math.round(distance * shipClassConfig.fuelPer100(ship.getShipClass()) / 100.0);
        if (burn <= 0) return;
        int fromMain = Math.min(ship.getFuelLevel(), burn);
        if (fromMain > 0) ship.setFuelLevel(ship.getFuelLevel() - fromMain);
        int overflow = burn - fromMain;
        if (overflow > 0 && ship.getReserveFuel() > 0) {
            ship.setReserveFuel(ship.getReserveFuel() - overflow);
        }
    }

    private MarketShipDTO toMarketDto(MarketShip s) {
        MarketShipDTO dto = new MarketShipDTO(s.getId(), s.getName(), s.getShipClass(), s.getPrice(),
                s.getDescription(), s.getCapacity(), s.getHealthPoints(), s.isUsed());
        dto.setSpeed(shipClassConfig.baseSpeedPerTick(s.getShipClass()));
        dto.setFuelPer100(shipClassConfig.fuelPer100(s.getShipClass()));
        return dto;
    }

    private FleetShipDTO toFleetDto(PlayerShip s) {
        List<CargoContractDTO> cargo = cargoContractRepository
                .findByAssignedShipIdAndStatus(s.getId(), CargoStatus.ACCEPTED)
                .stream()
                .map(c -> toCargoDto(c))
                .toList();

        boolean toUnload = cargoContractRepository
                .findByAssignedShipIdAndStatus(s.getId(), CargoStatus.CLOSED)
                .stream()
                .anyMatch(c -> c.getDestinationPortId().equals(s.getCurrentPortId()));

        int currentHp = s.getHealthPoints();
        int maxHp = s.getMaxHealthPoints();
        int hpPercentage = maxHp > 0 ? (int) Math.round(((double) currentHp / maxHp) * 100) : 0;

        boolean docked = s.getStatus() == ShipStatus.IDLE
                || s.getStatus() == ShipStatus.LOADING
                || s.getStatus() == ShipStatus.LOADED;

        FleetShipDTO dto = new FleetShipDTO(
                s.getId(), s.getName(), s.getShipClass(), s.getStatus(),
                s.getCurrentPortId(), s.isHasPilot(),
                s.getFuelLevel(), s.getHealthPoints(), s.getMaxHealthPoints(), hpPercentage,
                shipClassConfig.fuelPer100(s.getShipClass()),
                s.getDestinationPortId(), cargo, toUnload);
        dto.setPlayerId(s.getPlayerId());
        dto.setPrice(s.getPrice());
        dto.setSellPrice(sellPriceCalculator.calculateSellPrice(s));
        dto.setMortgaged(s.isMortgaged());
        dto.setCapacity(s.getCapacity());
        dto.setActiveRouteId(s.getActiveRouteId());

        if (s.getActiveRouteWaypoints() != null) {
            dto.setActiveRouteWaypoints(s.getActiveRouteWaypoints().stream()
                    .map(w -> new at.fhv.freight.dto.WaypointDTO(w.getX(), w.getY()))
                    .toList());
        }
        dto.setCurrentWaypointIndex(s.getCurrentWaypointIndex());
        dto.setRouteProgress(s.getRouteProgress());
        dto.setUsingAlternativeRoute(s.isUsingAlternativeRoute());
        dto.setReserveFuel(s.getReserveFuel());
        dto.setReserveFuelCapacity(s.getReserveFuelCapacity());
        dto.setDistancePerTick(shipClassConfig.baseSpeedPerTick(s.getShipClass())
                * shipSpeedFactor(s.getId()));
        dto.setLastVoyageProfit(s.getLastVoyageProfit());
        dto.setCanRepair(docked && currentHp < maxHp);
        dto.setCanRefuel(docked && s.getFuelLevel() < 100);
        dto.setCustomsStatus(s.getCustomsStatus());
        dto.setCustomsHoldRemainingTicks(s.getCustomsHoldRemainingTicks());
        dto.setRatsActive(s.isRatsActive());
        dto.setRatsTicks(s.getRatsTicks());
        dto.setRatsMode(s.getRatsMode());
        return dto;
    }

    private CargoContractDTO toCargoDto(CargoContract c) {
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
    private Waypoint toWaypoint(WaypointDTO w) {
        return new Waypoint(w.getX(), w.getY());
    }
}