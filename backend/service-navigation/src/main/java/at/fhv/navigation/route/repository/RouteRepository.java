package at.fhv.navigation.route.repository;

import at.fhv.navigation.route.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, String> {
    Optional<Route> findByFromPortIdAndToPortId(String fromPortId, String toPortId);
    List<Route> findAllByBlockGroup(String blockGroup);
    List<Route> findAllByBlockedTrue();
    List<Route> findAllByBlockedFalseAndEnforceFromTickIsNotNull();
    List<Route> findAllByBlockedUntilTickIsNotNull();
    List<Route> findAllByFromPortIdInOrToPortIdIn(List<String> fromIds, List<String> toIds);
    List<Route> findAllByToPortId(String toPortId);
}