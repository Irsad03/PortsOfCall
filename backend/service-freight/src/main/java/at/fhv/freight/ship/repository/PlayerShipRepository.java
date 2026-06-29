package at.fhv.freight.ship.repository;

import at.fhv.freight.dto.ShipStatus;
import at.fhv.freight.ship.model.PlayerShip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerShipRepository extends JpaRepository<PlayerShip, String> {
    List<PlayerShip> findAllByPlayerId(String playerId);
    List<PlayerShip> findAllBySessionId(String sessionId);
    List<PlayerShip> findAllByPlayerIdAndCurrentPortId(String playerId, String currentPortId);
    Optional<PlayerShip> findByIdAndPlayerId(String id, String playerId);
    List<PlayerShip> findAllBySessionIdAndStatus(String sessionId, ShipStatus status);
}
