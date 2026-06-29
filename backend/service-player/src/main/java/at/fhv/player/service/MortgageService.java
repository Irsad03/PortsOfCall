package at.fhv.player.service;

import at.fhv.player.dto.MortgageApplicationResponseDTO;
import at.fhv.player.dto.MortgageDTO;
import at.fhv.player.dto.MortgageOptionDTO;
import at.fhv.player.dto.MortgageQuoteDTO;
import at.fhv.player.dto.MortgageTransactionDTO;
import at.fhv.player.model.MortgageStatus;

import java.util.List;

public interface MortgageService {

    List<MortgageOptionDTO> getMortgageOptions(String playerId);

    MortgageQuoteDTO quoteMortgage(String playerId, String shipId, int amount, int termTicks);

    MortgageApplicationResponseDTO applyForMortgage(String playerId, String shipId,
                                                    int amount, int termTicks, int currentTick);

    List<MortgageDTO> getMortgages(String playerId, MortgageStatus status);

    List<MortgageTransactionDTO> getMortgageHistory(String mortgageId);

    MortgageDTO payInstallment(String mortgageId, int currentTick);

    MortgageDTO payOff(String mortgageId, int currentTick);

    void processTickForSession(String sessionId, int currentTick);
}
