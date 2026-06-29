package at.fhv.player.service;

import at.fhv.player.dto.LoanApplicationResponseDTO;
import at.fhv.player.dto.LoanDTO;
import at.fhv.player.dto.LoanQuoteDTO;
import at.fhv.player.dto.LoanTransactionDTO;
import at.fhv.player.model.LoanStatus;

import java.util.List;

public interface LoanService {
    LoanQuoteDTO quoteLoan(String playerId, int amount, int termTicks);
    LoanApplicationResponseDTO applyForLoan(String playerId, int amount, int termTicks, int currentTick);
    List<LoanDTO> getLoans(String playerId, LoanStatus status);
    List<LoanTransactionDTO> getLoanHistory(String loanId);
    LoanDTO payInstallment(String loanId, int currentTick);
    LoanDTO payOff(String loanId, int currentTick);
    void processTickForSession(String sessionId, int currentTick);
}
