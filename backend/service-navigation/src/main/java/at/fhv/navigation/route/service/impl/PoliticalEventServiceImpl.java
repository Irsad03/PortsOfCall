package at.fhv.navigation.route.service.impl;

import at.fhv.navigation.dto.PoliticalEventDTO;
import at.fhv.navigation.port.model.Port;
import at.fhv.navigation.port.repository.PortRepository;
import at.fhv.navigation.route.model.Route;
import at.fhv.navigation.route.repository.RouteRepository;
import at.fhv.navigation.route.service.PoliticalEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PoliticalEventServiceImpl implements PoliticalEventService {

    private static final Logger log = LoggerFactory.getLogger(PoliticalEventServiceImpl.class);

    private enum Targeting { ROUTE, PORT }

    private record GroupConfig(
            String id,
            Targeting targeting,
            List<String> portNames,
            boolean hasAlternative,
            String canalPortName,
            List<String> headlines
    ) {}

    private static final List<GroupConfig> GROUPS = List.of(
            new GroupConfig("SUEZ_CANAL", Targeting.ROUTE, null, true, null, List.of(
                    "Suez canal closed due to diplomatic crisis",
                    "Suez canal blocked — international tensions rising"
            )),
            new GroupConfig("PANAMA_CANAL", Targeting.ROUTE, null, true, "Panama City", List.of(
                    "Panama canal under maintenance",
                    "Panama canal locks closed for emergency repairs"
            )),
            new GroupConfig("NORTH_ATLANTIC", Targeting.PORT,
                    List.of("New York", "London", "Hamburg"), false, null, List.of(
                    "North Atlantic shipping embargo",
                    "Trade sanctions disrupt North Atlantic shipping lanes"
            )),
            new GroupConfig("STRAIT_OF_HORMUZ", Targeting.PORT,
                    List.of("Dubai"), false, null, List.of(
                    "Strait of Hormuz blockade",
                    "Naval standoff closes Strait of Hormuz to merchant traffic"
            ))
    );

    private record StrikeGroup(String id, List<String> portNames, List<String> headlines) {}

    private static final List<StrikeGroup> STRIKE_GROUPS = List.of(
            new StrikeGroup("NORTH_SEA_PILOTS",
                    List.of("Hamburg", "London", "Dublin"), List.of(
                    "Harbour pilots' union strikes across the North Sea",
                    "Pilot walkout shuts down North Sea docking services"
            )),
            new StrikeGroup("MEDITERRANEAN_PILOTS",
                    List.of("Lisbon", "Istanbul", "Palermo"), List.of(
                    "Mediterranean harbour pilots down tools",
                    "Pilot strike grips Mediterranean ports"
            )),
            new StrikeGroup("ATLANTIC_PILOTS",
                    List.of("New York", "Panama City", "Rio de Janeiro", "Lagos"), List.of(
                    "Atlantic harbour pilots walk off the job",
                    "Pilot strike disrupts docking across Atlantic ports"
            )),
            new StrikeGroup("ASIA_GULF_PILOTS",
                    List.of("Mumbai", "Dubai", "Tokyo"), List.of(
                    "Pilots strike across Gulf & Asian harbours",
                    "Harbour pilots' walkout hits Asian ports"
            ))
    );

    private final RouteRepository routeRepository;
    private final PortRepository portRepository;
    private final Random random = new Random();

    private final AtomicInteger globalTick = new AtomicInteger(0);
    private final int routeMinGapTicks;
    private final int routeMaxGapTicks;
    private final int minDuration;
    private final int maxDuration;
    private final int gracePeriodTicks;

    private final int strikeMinGapTicks;
    private final int strikeMaxGapTicks;
    private final int strikeMinDuration;
    private final int strikeMaxDuration;

    private int nextRouteTriggerTick;
    private int nextStrikeTriggerTick;

    public PoliticalEventServiceImpl(
            RouteRepository routeRepository,
            PortRepository portRepository,
            @Value("${game.political-events.min-gap-ticks:8}") int routeMinGapTicks,
            @Value("${game.political-events.max-gap-ticks:16}") int routeMaxGapTicks,
            @Value("${game.political-events.min-duration-ticks:50}") int minDuration,
            @Value("${game.political-events.max-duration-ticks:70}") int maxDuration,
            @Value("${game.political-events.grace-period-ticks:3}") int gracePeriodTicks,
            @Value("${game.pilot-strikes.min-gap-ticks:20}") int strikeMinGapTicks,
            @Value("${game.pilot-strikes.max-gap-ticks:40}") int strikeMaxGapTicks,
            @Value("${game.pilot-strikes.min-duration-ticks:35}") int strikeMinDuration,
            @Value("${game.pilot-strikes.max-duration-ticks:50}") int strikeMaxDuration) {
        this.routeRepository = routeRepository;
        this.portRepository = portRepository;
        this.routeMinGapTicks = Math.max(1, routeMinGapTicks);
        this.routeMaxGapTicks = Math.max(this.routeMinGapTicks, routeMaxGapTicks);
        this.minDuration = minDuration;
        this.maxDuration = Math.max(maxDuration, minDuration);
        this.gracePeriodTicks = Math.max(0, gracePeriodTicks);
        this.strikeMinGapTicks = Math.max(1, strikeMinGapTicks);
        this.strikeMaxGapTicks = Math.max(this.strikeMinGapTicks, strikeMaxGapTicks);
        this.strikeMinDuration = strikeMinDuration;
        this.strikeMaxDuration = Math.max(strikeMaxDuration, strikeMinDuration);

        // Initial warmup gap (measured from tick 0).
        this.nextRouteTriggerTick = pickGap(this.routeMinGapTicks, this.routeMaxGapTicks);
        this.nextStrikeTriggerTick = pickGap(this.strikeMinGapTicks, this.strikeMaxGapTicks);
    }

    // A random gap in [minGap, maxGap].
    private int pickGap(int minGap, int maxGap) {
        int span = maxGap - minGap;
        return minGap + (span > 0 ? random.nextInt(span + 1) : 0);
    }

    @Override
    @Transactional
    public List<PoliticalEventDTO> processTick() {
        int currentTick = globalTick.incrementAndGet();
        List<PoliticalEventDTO> events = new ArrayList<>();

        //  1. Unblock expired
        Map<String, List<Route>> blockedByReason = new HashMap<>();
        for (Route r : routeRepository.findAllByBlockedTrue()) {
            blockedByReason.computeIfAbsent(r.getBlockReason(), k -> new ArrayList<>()).add(r);
        }
        for (Map.Entry<String, List<Route>> entry : blockedByReason.entrySet()) {
            List<Route> group = entry.getValue();
            Route first = group.get(0);
            if (first.getBlockedUntilTick() != null && currentTick >= first.getBlockedUntilTick()) {
                String capturedBlockType = first.getBlockType();
                for (Route r : group) {
                    r.setBlocked(false);
                    r.setBlockedUntilTick(null);
                    r.setEnforceFromTick(null);
                    r.setBlockReason(null);
                    r.setBlockType(null);
                    routeRepository.save(r);
                }
                events.add(new PoliticalEventDTO(
                        PoliticalEventDTO.Type.ROUTE_UNBLOCKED,
                        null, capturedBlockType,
                        "Route reopened: " + entry.getKey(),
                        null, null, null, null, false,
                        toPortPairs(group)
                ));
                log.info("Political event UNBLOCKED ({} routes) at tick {}", group.size(), currentTick);
            }
        }

        // 2. Activate grace-expired (Grace → Enforced)
        Map<String, List<Route>> graceByReason = new HashMap<>();
        for (Route r : routeRepository.findAllByBlockedFalseAndEnforceFromTickIsNotNull()) {
            graceByReason.computeIfAbsent(r.getBlockReason(), k -> new ArrayList<>()).add(r);
        }
        for (Map.Entry<String, List<Route>> entry : graceByReason.entrySet()) {
            List<Route> group = entry.getValue();
            Route first = group.get(0);
            if (first.getEnforceFromTick() != null && currentTick >= first.getEnforceFromTick()) {
                for (Route r : group) {
                    r.setBlocked(true);
                    routeRepository.save(r);
                }

                boolean altAvailable = group.stream().anyMatch(Route::hasAlternative);
                Integer remaining = first.getBlockedUntilTick() != null
                        ? first.getBlockedUntilTick() - currentTick
                        : null;
                events.add(new PoliticalEventDTO(
                        PoliticalEventDTO.Type.ROUTE_ENFORCED,
                        null, first.getBlockType(),
                        first.getBlockReason(),
                        first.getBlockReason(),
                        first.getBlockedUntilTick(),
                        remaining,
                        null,
                        altAvailable,
                        toPortPairs(group)
                ));
                log.info("Political event ENFORCED ({} routes) at tick {}", group.size(), currentTick);
            }
        }

        // 3. Maybe trigger a new event
        boolean anythingActive = !routeRepository.findAllByBlockedUntilTickIsNotNull().isEmpty();
        if (!anythingActive && currentTick >= nextRouteTriggerTick) {
            GroupConfig group = GROUPS.get(random.nextInt(GROUPS.size()));
            PoliticalEventDTO triggered = triggerGroup(group, currentTick);
            if (triggered != null) {
                events.add(triggered);
                Integer until = triggered.getUntilTick();
                int endTick = until != null ? until : currentTick + gracePeriodTicks + maxDuration;
                nextRouteTriggerTick = endTick + pickGap(routeMinGapTicks, routeMaxGapTicks);
            } else {
                // Misconfigured group resolved to no routes — retry after the
                // minimum gap instead of hammering every tick.
                nextRouteTriggerTick = currentTick + routeMinGapTicks;
            }
        }

        // 4. Pilot strikes — independent lifecycle
        processPilotStrikes(currentTick, events);

        return events;
    }

    // Pilot strike lifecycle
    private void processPilotStrikes(int currentTick, List<PoliticalEventDTO> events) {
        // 4a. End expired strikes, grouped by scenario id.
        Map<String, List<Port>> strikingByGroup = new HashMap<>();
        for (Port p : portRepository.findAllByPilotStrikeUntilTickIsNotNull()) {
            strikingByGroup.computeIfAbsent(p.getPilotStrikeGroup(), k -> new ArrayList<>()).add(p);
        }
        for (Map.Entry<String, List<Port>> entry : strikingByGroup.entrySet()) {
            List<Port> group = entry.getValue();
            Integer until = group.get(0).getPilotStrikeUntilTick();
            if (until != null && currentTick >= until) {
                String headline = group.get(0).getPilotStrikeHeadline();
                List<PoliticalEventDTO.AffectedPort> affected = toAffectedPorts(group);
                for (Port p : group) {
                    p.setPilotStrikeUntilTick(null);
                    p.setPilotStrikeGroup(null);
                    p.setPilotStrikeHeadline(null);
                    portRepository.save(p);
                }
                events.add(strikeEvent(PoliticalEventDTO.Type.PILOT_STRIKE_ENDED,
                        entry.getKey(), headline, null, affected));
                log.info("Pilot strike ENDED group {} ({} ports) at tick {}",
                        entry.getKey(), group.size(), currentTick);
            }
        }

        // 4b. Maybe trigger a new strike — scheduled-gap model, like route events.
        boolean strikeActive = !portRepository.findAllByPilotStrikeUntilTickIsNotNull().isEmpty();
        if (!strikeActive && currentTick >= nextStrikeTriggerTick) {
            PoliticalEventDTO triggered = triggerStrike(currentTick);
            if (triggered != null) {
                events.add(triggered);
                Integer dur = triggered.getDurationTicks();
                int endTick = currentTick + (dur != null ? dur : strikeMaxDuration);
                nextStrikeTriggerTick = endTick + pickGap(strikeMinGapTicks, strikeMaxGapTicks);
            } else {
                nextStrikeTriggerTick = currentTick + strikeMinGapTicks;
            }
        }
    }

    private PoliticalEventDTO triggerStrike(int currentTick) {
        StrikeGroup group = STRIKE_GROUPS.get(random.nextInt(STRIKE_GROUPS.size()));
        int duration  = strikeMinDuration + random.nextInt(strikeMaxDuration - strikeMinDuration + 1);
        int untilTick = currentTick + duration;
        String headline = group.headlines().get(random.nextInt(group.headlines().size()));

        List<Port> affected = new ArrayList<>();
        for (Port p : portRepository.findAll()) {
            if (group.portNames().contains(p.getName())) affected.add(p);
        }
        if (affected.isEmpty()) {
            log.warn("Strike group {} resolved to 0 ports — skipping trigger.", group.id());
            return null;
        }

        for (Port p : affected) {
            p.setPilotStrikeUntilTick(untilTick);
            p.setPilotStrikeGroup(group.id());
            p.setPilotStrikeHeadline(headline);
            portRepository.save(p);
        }

        log.info("Pilot strike TRIGGERED group {} at tick {} (until {}, {} ports)",
                group.id(), currentTick, untilTick, affected.size());

        return strikeEvent(PoliticalEventDTO.Type.PILOT_STRIKE_STARTED,
                group.id(), headline, duration, toAffectedPorts(affected));
    }

    private PoliticalEventDTO strikeEvent(PoliticalEventDTO.Type type, String group,
                                          String headline, Integer durationTicks,
                                          List<PoliticalEventDTO.AffectedPort> affectedPorts) {
        PoliticalEventDTO dto = new PoliticalEventDTO();
        dto.setType(type);
        dto.setBlockGroup(group);
        dto.setBlockType("PILOT");
        dto.setHeadline(headline);
        dto.setReason(headline);
        dto.setDurationTicks(durationTicks);
        dto.setAffectedPorts(affectedPorts);
        return dto;
    }

    private List<PoliticalEventDTO.AffectedPort> toAffectedPorts(List<Port> ports) {
        List<PoliticalEventDTO.AffectedPort> out = new ArrayList<>(ports.size());
        for (Port p : ports) {
            out.add(new PoliticalEventDTO.AffectedPort(p.getId(), p.getName()));
        }
        return out;
    }

    private PoliticalEventDTO triggerGroup(GroupConfig group, int currentTick) {
        int duration  = minDuration + random.nextInt(maxDuration - minDuration + 1);
        int enforceAt = currentTick + gracePeriodTicks;
        int untilTick = enforceAt + duration;
        String headline = group.headlines.get(random.nextInt(group.headlines.size()));

        boolean routeTargeting = group.targeting == Targeting.ROUTE;

        List<Route> affected;
        String canalPortId = null;
        if (routeTargeting) {
            affected = new ArrayList<>(routeRepository.findAllByBlockGroup(group.id));

            if (group.canalPortName != null) {
                canalPortId = resolvePortIdByName(group.canalPortName);
                if (canalPortId != null) {
                    Set<String> seen = new HashSet<>();
                    for (Route r : affected) seen.add(r.getId());
                    for (Route r : routeRepository.findAllByFromPortIdInOrToPortIdIn(
                            List.of(canalPortId), List.of(canalPortId))) {
                        if (seen.add(r.getId())) affected.add(r);
                    }
                }
            }
        } else {
            List<String> portIds = new ArrayList<>();
            for (Port p : portRepository.findAll()) {
                if (group.portNames.contains(p.getName())) portIds.add(p.getId());
            }
            if (portIds.isEmpty()) {
                log.warn("Port-based group {} has no resolved ports — skipping trigger.", group.id);
                return null;
            }
            affected = routeRepository.findAllByFromPortIdInOrToPortIdIn(portIds, portIds);
        }

        if (affected.isEmpty()) {
            log.warn("Group {} resolved to 0 routes — nothing to block.", group.id);
            return null;
        }

        for (Route r : affected) {

            String perRouteBlockType = (routeTargeting && r.hasAlternative()) ? "ROUTE" : "PORT";
            // Grace state: ships can still depart, but the metadata is staged.
            r.setBlocked(false);
            r.setBlockedUntilTick(untilTick);
            r.setEnforceFromTick(enforceAt);
            r.setBlockReason(headline);
            r.setBlockType(perRouteBlockType);
            routeRepository.save(r);
        }

        log.info("Political event TRIGGERED group {} at tick {} (grace until {}, full block until {}, {} routes)",
                group.id, currentTick, enforceAt, untilTick, affected.size());

        return new PoliticalEventDTO(
                PoliticalEventDTO.Type.ROUTE_BLOCKED,
                group.id,
                routeTargeting ? "ROUTE" : "PORT",
                headline,
                headline,
                untilTick,
                duration,
                gracePeriodTicks,
                group.hasAlternative,
                toPortPairs(affected)
        );
    }

    private String resolvePortIdByName(String name) {
        for (Port p : portRepository.findAll()) {
            if (p.getName().equals(name)) return p.getId();
        }
        return null;
    }

    @Override
    public List<PoliticalEventDTO.PortPair> getCurrentlyBlockedRoutes() {
        return toPortPairs(routeRepository.findAllByBlockedTrue());
    }

    @Override
    public List<String> getCurrentPilotStrikePortIds() {
        List<String> ids = new ArrayList<>();
        for (Port p : portRepository.findAllByPilotStrikeUntilTickIsNotNull()) {
            ids.add(p.getId());
        }
        return ids;
    }

    private List<PoliticalEventDTO.PortPair> toPortPairs(List<Route> routes) {
        List<PoliticalEventDTO.PortPair> out = new ArrayList<>(routes.size());
        for (Route r : routes) {
            // A detour only counts for ROUTE-targeted (canal) blocks. A PORT embargo
            // can sweep in a canal route that has detour waypoints, but for an embargo
            // there is NO alternative — so only flag per-route when both hold.
            boolean alt = "ROUTE".equals(r.getBlockType()) && r.hasAlternative();
            out.add(new PoliticalEventDTO.PortPair(r.getFromPortId(), r.getToPortId(), alt));
        }
        return out;
    }
}