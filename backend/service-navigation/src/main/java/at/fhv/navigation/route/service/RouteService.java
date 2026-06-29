package at.fhv.navigation.route.service;

import at.fhv.navigation.dto.RouteDTO;

import java.util.Optional;

public interface RouteService {
    RouteDTO findById(String id);
    Optional<RouteDTO> findByFromAndTo(String fromPortId, String toPortId);
}