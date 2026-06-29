package at.fhv.navigation.config;

import at.fhv.navigation.port.model.Port;
import at.fhv.navigation.port.repository.PortRepository;
import at.fhv.navigation.route.model.Route;
import at.fhv.navigation.route.model.Waypoint;
import at.fhv.navigation.route.repository.RouteRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;


@Configuration
public class NavigationDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(NavigationDataInitializer.class);

    private static final Set<String> EAST_PORTS =
            Set.of("Mumbai", "Tokyo", "Dubai");
    private static final Set<String> EUROPE_PORTS =
            Set.of("Hamburg", "Lisbon", "London", "Dublin", "Palermo", "Istanbul");
    private static final Set<String> AMERICAS_PORTS =
            Set.of("New York", "Panama City");

    private static String canalFor(String a, String b) {
        boolean aEast = EAST_PORTS.contains(a), bEast = EAST_PORTS.contains(b);
        if (aEast == bEast) return null;                 // both East or neither → no canal
        String west = aEast ? b : a;                     // the non-East endpoint
        if (EUROPE_PORTS.contains(west))   return "SUEZ_CANAL";
        if (AMERICAS_PORTS.contains(west)) return "PANAMA_CANAL";
        return null;
    }

    @Bean
    @Transactional
    CommandLineRunner seedNavigation(PortRepository portRepo, RouteRepository routeRepo) {
        return args -> {
            NavData data = loadNavData();
            if (data == null || data.ports.isEmpty()) {
                log.warn("navigation-data.json missing or empty – skipping navigation seed.");
                return;
            }

            // 1. Seed ports
            if (portRepo.count() == 0) {
                for (PortDef p : data.ports) {
                    portRepo.save(new Port(p.name, p.x, p.y));
                }
                log.info("Seeded {} ports from navigation-data.json.", portRepo.count());
            } else {
                log.info("Ports already seeded – skipping.");
            }

            List<Port> ports = portRepo.findAll();
            Map<String, Port> byName = new HashMap<>();
            for (Port p : ports) byName.put(p.getName(), p);

            //  2. Seed routes
            if (routeRepo.count() == 0) {
                Map<String, List<Edge>> graph = buildGraph(data.edges, byName);
                buildAndSaveAllRoutes(routeRepo, ports, graph);
                log.info("Seeded {} route combinations.", routeRepo.count());
            } else {
                log.info("Routes already seeded – skipping.");
            }

            // 3. Backfill block-group + alternative waypoints
            backfillBlockGroups(byName, routeRepo);
            backfillAlternatives(data.alternatives, byName, routeRepo);
        };
    }

    private NavData loadNavData() {
        try (InputStream is = new ClassPathResource("navigation-data.json").getInputStream()) {
            ObjectMapper om = new ObjectMapper()
                    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            return om.readValue(is, NavData.class);
        } catch (Exception ex) {
            log.error("Failed to read navigation-data.json: {}", ex.getMessage());
            return null;
        }
    }

    // JSON shape
    static class NavData {
        public List<PortDef> ports = new ArrayList<>();
        public List<EdgeDef> edges = new ArrayList<>();
        public List<AltGroupDef> alternatives = new ArrayList<>();
    }
    static class PortDef { public String name; public int x; public int y; }
    static class EdgeDef { public String a; public String b; public List<Pt> waypoints = new ArrayList<>(); }
    static class AltGroupDef { public String blockGroup; public List<EdgeDef> edges = new ArrayList<>(); }
    static class Pt { public int x; public int y; }

    // Graph helpers
    record Edge(Port to, List<Waypoint> waypoints) {}

    private Map<String, List<Edge>> buildGraph(List<EdgeDef> edges, Map<String, Port> byName) {
        Map<String, List<Edge>> graph = new HashMap<>();
        for (EdgeDef e : edges) {
            Port a = byName.get(e.a);
            Port b = byName.get(e.b);
            if (a == null || b == null) {
                log.warn("Skipping edge {} → {}: unknown port name.", e.a, e.b);
                continue;
            }
            if (e.waypoints == null || e.waypoints.size() < 2) {
                log.warn("Skipping edge {} → {}: needs at least 2 waypoints.", e.a, e.b);
                continue;
            }
            List<Waypoint> wps = new ArrayList<>(e.waypoints.size());
            for (Pt pt : e.waypoints) wps.add(new Waypoint(pt.x, pt.y));
            addEdge(graph, a, b, wps);
        }
        return graph;
    }

    private void addEdge(Map<String, List<Edge>> graph, Port a, Port b, List<Waypoint> pts) {
        graph.computeIfAbsent(a.getId(), k -> new ArrayList<>()).add(new Edge(b, pts));
        List<Waypoint> reversed = new ArrayList<>(pts);
        Collections.reverse(reversed);
        graph.computeIfAbsent(b.getId(), k -> new ArrayList<>()).add(new Edge(a, reversed));
    }

    private void buildAndSaveAllRoutes(RouteRepository routeRepo, List<Port> allPorts,
                                       Map<String, List<Edge>> graph) {
        for (int i = 0; i < allPorts.size(); i++) {
            for (int j = i + 1; j < allPorts.size(); j++) {
                Port start = allPorts.get(i);
                Port end = allPorts.get(j);
                List<Waypoint> path = directEdge(start, end, graph);
                if (path != null && path.size() > 1) {
                    saveBidirectionalRoute(routeRepo, start, end, path);
                } else {
                    log.warn("No hand-drawn edge for {} <-> {} – no route seeded for this pair.",
                            start.getName(), end.getName());
                }
            }
        }
    }

    private List<Waypoint> directEdge(Port start, Port end, Map<String, List<Edge>> graph) {
        for (Edge edge : graph.getOrDefault(start.getId(), Collections.emptyList())) {
            if (edge.to().getId().equals(end.getId())) {
                return edge.waypoints();
            }
        }
        return null;
    }

    private List<Waypoint> joinDrawnDetour(Port start, Port end,
                                           Map<String, List<Edge>> graph) {
        record Step(Port current, List<Waypoint> path) {}

        Queue<Step> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        queue.add(new Step(start,
                new ArrayList<>(List.of(new Waypoint(start.getX(), start.getY())))));
        visited.add(start.getId());

        while (!queue.isEmpty()) {
            Step step = queue.poll();
            if (step.current().getId().equals(end.getId())) return step.path();

            for (Edge edge : graph.getOrDefault(step.current().getId(), Collections.emptyList())) {
                if (visited.add(edge.to().getId())) {
                    List<Waypoint> newPath = new ArrayList<>(step.path());
                    if (edge.waypoints().size() > 1) {
                        newPath.addAll(edge.waypoints().subList(1, edge.waypoints().size()));
                    }
                    queue.add(new Step(edge.to(), newPath));
                }
            }
        }
        return null;
    }

    private void backfillBlockGroups(Map<String, Port> byName, RouteRepository routeRepo) {
        Map<String, String> portIdToName = new HashMap<>();
        for (Port p : byName.values()) portIdToName.put(p.getId(), p.getName());

        int updated = 0;
        int cleared = 0;
        for (Route r : routeRepo.findAll()) {
            String aName = portIdToName.get(r.getFromPortId());
            String bName = portIdToName.get(r.getToPortId());
            if (aName == null || bName == null) continue;
            String expected = canalFor(aName, bName);

            if (expected != null && !expected.equals(r.getBlockGroup())) {
                r.setBlockGroup(expected);
                routeRepo.save(r);
                updated++;
            } else if (expected == null && r.getBlockGroup() != null) {

                r.setBlockGroup(null);
                routeRepo.save(r);
                cleared++;
            }
        }
        if (updated + cleared > 0) {
            log.info("Block-group backfill: {} set, {} cleared.", updated, cleared);
        }
    }

    private void backfillAlternatives(List<AltGroupDef> altGroups,
                                      Map<String, Port> byName,
                                      RouteRepository routeRepo) {
        if (altGroups == null || altGroups.isEmpty()) return;

        Map<String, Port> portsById = new HashMap<>();
        for (Port p : byName.values()) portsById.put(p.getId(), p);

        int populated = 0;
        for (AltGroupDef group : altGroups) {
            if (group.blockGroup == null || group.edges == null || group.edges.isEmpty()) continue;

            Map<String, List<Edge>> subgraph = buildGraph(group.edges, byName);

            List<Route> affected = routeRepo.findAllByBlockGroup(group.blockGroup);
            for (Route r : affected) {
                Port from = portsById.get(r.getFromPortId());
                Port to   = portsById.get(r.getToPortId());
                if (from == null || to == null) continue;

                List<Waypoint> altPath = joinDrawnDetour(from, to, subgraph);
                if (altPath != null && altPath.size() > 1) {
                    r.setAlternativeWaypoints(altPath);
                    routeRepo.save(r);
                    populated++;
                } else {

                    log.debug("No detour in {} subgraph for {} → {} (route stays fully closed)",
                            group.blockGroup, from.getName(), to.getName());
                }
            }
        }
        if (populated > 0) log.info("Alternative waypoints populated on {} route(s).", populated);
    }

    private void saveBidirectionalRoute(RouteRepository repo, Port portA, Port portB,
                                        List<Waypoint> waypoints) {
        String blockGroup = canalFor(portA.getName(), portB.getName());

        Route forward = new Route(portA.getId(), portB.getId(), waypoints);
        forward.setBlockGroup(blockGroup);
        repo.save(forward);

        List<Waypoint> reversed = new ArrayList<>(waypoints);
        Collections.reverse(reversed);
        Route backward = new Route(portB.getId(), portA.getId(), reversed);
        backward.setBlockGroup(blockGroup);
        repo.save(backward);
    }
}