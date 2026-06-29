package at.fhv.navigation.route.service.impl;

import at.fhv.navigation.dto.RouteDTO;
import at.fhv.navigation.dto.WaypointDTO;
import at.fhv.navigation.route.model.Route;
import at.fhv.navigation.route.repository.RouteRepository;
import at.fhv.navigation.route.service.RouteNotFoundException;
import at.fhv.navigation.route.service.RouteService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;

    public RouteServiceImpl(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @Override
    public RouteDTO findById(String id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException("Route not found: " + id));
        return toDto(route);
    }

    @Override
    public Optional<RouteDTO> findByFromAndTo(String fromPortId, String toPortId) {
        return routeRepository.findByFromPortIdAndToPortId(fromPortId, toPortId).map(this::toDto);
    }

    private RouteDTO toDto(Route r) {
        List<WaypointDTO> waypoints = r.getWaypoints().stream()
                .map(w -> new WaypointDTO(w.getX(), w.getY()))
                .toList();
        RouteDTO dto = new RouteDTO(r.getId(), r.getFromPortId(), r.getToPortId(), waypoints, r.getTotalTicks());
        dto.setBlockGroup(r.getBlockGroup());
        dto.setBlockable(r.isBlockable());
        dto.setBlocked(r.isBlocked());
        dto.setBlockedUntilTick(r.getBlockedUntilTick());
        dto.setBlockReason(r.getBlockReason());
        dto.setBlockType(r.getBlockType());
        dto.setHasAlternative(r.hasAlternative());
        if (r.getAlternativeWaypoints() != null) {
            dto.setAlternativeWaypoints(r.getAlternativeWaypoints().stream()
                    .map(w -> new WaypointDTO(w.getX(), w.getY()))
                    .toList());
            dto.setAlternativeTotalTicks(r.getAlternativeTotalTicks());
        }
        return dto;
    }
}