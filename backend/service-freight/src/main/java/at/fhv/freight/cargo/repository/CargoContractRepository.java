package at.fhv.freight.cargo.repository;

import at.fhv.freight.dto.CargoStatus;
import at.fhv.freight.cargo.model.CargoContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CargoContractRepository extends JpaRepository<CargoContract, String> {

    List<CargoContract> findBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThan(
            String sessionId, String originPortId, CargoStatus status, Integer currentTick);

    List<CargoContract> findBySessionIdAndStatusAndExpiresAtTickGreaterThan(
            String sessionId, CargoStatus status, Integer currentTick);

    long countBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThan(
            String sessionId, String originPortId, CargoStatus status, Integer currentTick);

    long countBySessionIdAndOriginPortIdAndStatusAndExpiresAtTickGreaterThanAndRequiredCapacityLessThanEqual(
            String sessionId, String originPortId, CargoStatus status, Integer currentTick, Integer requiredCapacity);

    List<CargoContract> findBySessionIdAndStatus(String sessionId, CargoStatus status);

    List<CargoContract> findByAssignedShipIdAndStatus(String assignedShipId, CargoStatus status);

    void deleteBySessionIdAndStatusAndExpiresAtTickLessThanEqual(
            String sessionId, CargoStatus status, Integer currentTick);

    void deleteByAssignedShipIdIn(List<String> shipIds);

    List<CargoContract> findByAssignedShipIdAndIllegalTrueAndStatusIn(
            String assignedShipId, Collection<CargoStatus> statuses);
}
