package at.fhv.navigation.port.repository;

import at.fhv.navigation.port.model.Port;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortRepository extends JpaRepository<Port, String> {
    List<Port> findAllByPilotStrikeUntilTickIsNotNull();
}