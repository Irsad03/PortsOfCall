package at.fhv.player.repository;

import at.fhv.player.model.LoanTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanTransactionRepository extends JpaRepository<LoanTransaction, String> {

    List<LoanTransaction> findByLoanId(String loanId);

    List<LoanTransaction> findByLoanIdOrderByTickAscIdAsc(String loanId);
}
