package at.fhv.freight.ship.repository;

import at.fhv.freight.ship.model.MarketShip;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketShipRepository extends JpaRepository<MarketShip, String> {
}
