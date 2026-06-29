package at.fhv.player.repository;

import at.fhv.player.model.MortgageTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MortgageTransactionRepository extends JpaRepository<MortgageTransaction, String> {

    List<MortgageTransaction> findByMortgageId(String mortgageId);

    List<MortgageTransaction> findByMortgageIdOrderByTickAscIdAsc(String mortgageId);
}
