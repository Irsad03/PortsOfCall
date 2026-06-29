package at.fhv.freight.cargo.service;

import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.dto.PortDTO;
import at.fhv.freight.cargo.model.CargoContract;
import at.fhv.freight.cargo.repository.CargoContractRepository;
import at.fhv.freight.client.PortClient;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
public class CargoContractRefillService {

    private static final int OPEN_CONTRACTS_PER_PORT = 6;

    // Guarantee small jobs that fit a Low-Budget ship (50t capacity).
    private static final int SMALL_CAPACITY_MAX = 40;
    private static final int MIN_SMALL_CONTRACTS_PER_PORT = 2;

    private static final double SLOWEST_SHIP_SPEED = 30.0; // distance units per tick
    private static final double DEADLINE_MARGIN = 2.0;
    private static final int DEADLINE_BASE_TICKS = 6;
    private static final double HIGH_RISK_DEADLINE_FACTOR = 0.65;

    private final CargoContractRepository repository;
    private final PortClient portClient;
    private final SecureRandom random = new SecureRandom();

    private static final List<ContractTemplate> TEMPLATES = List.of(
            new ContractTemplate("Coffee from {origin}", 2600, 3800, 50, 150),
            new ContractTemplate("Steel to {destination}", 4300, 6000, 200, 300),
            new ContractTemplate("Timber shipment", 2000, 3100, 100, 200),
            new ContractTemplate("Electronics from {origin}", 5200, 7700, 80, 120),
            new ContractTemplate("Textiles to {destination}", 2700, 3600, 60, 180),
            new ContractTemplate("Machinery", 6800, 10000, 250, 400)
    );

    // Small parcel jobs (<= 40t) so a Low-Budget ship always has something to haul.
    private static final ContractTemplate SMALL_TEMPLATE =
            new ContractTemplate("Spice crates from {origin}", 1400, 2200, 20, SMALL_CAPACITY_MAX);

    public CargoContractRefillService(CargoContractRepository repository, PortClient portClient) {
        this.repository = repository;
        this.portClient = portClient;
    }

    @Transactional
    public void refill(String sessionId, int currentTick) {
        repository.deleteBySessionIdAndStatusAndExpiresAtTickLessThanEqual(
                sessionId, CargoStatus.OPEN, currentTick);

        List<PortDTO> allPorts = portClient.getAllPorts();
        if (allPorts.size() < 2) return;

        for (PortDTO port : allPorts) {
            long openCount = repository.countBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThan(
                    sessionId, port.getId(), CargoStatus.OPEN, currentTick);
            long smallOpenCount = repository
                    .countBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThanAndRequiredCapacityLessThanEqual(
                            sessionId, port.getId(), CargoStatus.OPEN, currentTick, SMALL_CAPACITY_MAX);
            int toCreate = (int) (OPEN_CONTRACTS_PER_PORT - openCount);
            int smallToCreate = (int) (MIN_SMALL_CONTRACTS_PER_PORT - smallOpenCount);
            for (int i = 0; i < toCreate; i++) {
                boolean forceSmall = i < smallToCreate;
                createRandomContractForPort(sessionId, port, allPorts, currentTick, forceSmall);
            }
        }
    }

    private void createRandomContractForPort(String sessionId, PortDTO origin,
                                             List<PortDTO> allPorts, int currentTick,
                                             boolean forceSmall) {
        ContractTemplate tmpl = forceSmall
                ? SMALL_TEMPLATE
                : TEMPLATES.get(random.nextInt(TEMPLATES.size()));
        int reward = tmpl.minReward + random.nextInt(tmpl.maxReward - tmpl.minReward + 1);
        int capacity = tmpl.minCapacity + random.nextInt(tmpl.maxCapacity - tmpl.minCapacity + 1);

        boolean isHighRisk = random.nextDouble() > 0.7;
        String riskLevel = isHighRisk ? "HIGH" : "LOW";
        if (isHighRisk) {
            reward = (int) (reward * 1.5);
        }

        PortDTO destination = pickDifferentPort(origin, allPorts);
        String description = tmpl.descriptionTemplate
                .replace("{origin}", origin.getName())
                .replace("{destination}", destination.getName());

        // Distance-based deadline: longer trips get proportionally more ticks.
        int expiryTicks = deadlineTicks(origin, destination, isHighRisk);

        CargoContract contract = new CargoContract(sessionId, description, reward, capacity,
                origin.getId(), destination.getId(), riskLevel);
        contract.setCreatedAtTick(currentTick);
        contract.setExpiresAtTick(currentTick + expiryTicks);
        contract.setStatus(CargoStatus.OPEN);

        repository.save(contract);
    }

    private int deadlineTicks(PortDTO origin, PortDTO destination, boolean isHighRisk) {
        double chord = Math.hypot(origin.getX() - destination.getX(),
                origin.getY() - destination.getY());
        int normal = DEADLINE_BASE_TICKS
                + (int) Math.ceil(chord * DEADLINE_MARGIN / SLOWEST_SHIP_SPEED);
        if (!isHighRisk) return normal;
        return Math.max(DEADLINE_BASE_TICKS,
                (int) Math.round(normal * HIGH_RISK_DEADLINE_FACTOR));
    }

    private PortDTO pickDifferentPort(PortDTO exclude, List<PortDTO> allPorts) {
        List<PortDTO> candidates = allPorts.stream()
                .filter(p -> !p.getId().equals(exclude.getId()))
                .toList();
        return candidates.get(random.nextInt(candidates.size()));
    }

    private record ContractTemplate(String descriptionTemplate, int minReward, int maxReward,
                                    int minCapacity, int maxCapacity) {}
}
