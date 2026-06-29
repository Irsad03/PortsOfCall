package at.fhv.player.repository;

import at.fhv.player.model.Mortgage;
import at.fhv.player.model.MortgageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MortgageRepository extends JpaRepository<Mortgage, String> {

    List<Mortgage> findByPlayerId(String playerId);

    List<Mortgage> findByPlayerIdAndStatus(String playerId, MortgageStatus status);

    List<Mortgage> findByPlayerIdInAndStatusIn(Collection<String> playerIds, Collection<MortgageStatus> statuses);

    List<Mortgage> findByShipIdAndStatusIn(String shipId, Collection<MortgageStatus> statuses);
}
