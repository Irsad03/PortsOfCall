package at.fhv.player.repository;

import at.fhv.player.model.Loan;
import at.fhv.player.model.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, String> {

    List<Loan> findByPlayerId(String playerId);

    List<Loan> findByPlayerIdAndStatus(String playerId, LoanStatus status);

    List<Loan> findByPlayerIdInAndStatusIn(Collection<String> playerIds, Collection<LoanStatus> statuses);
}
