package at.fhv.player.service;

import at.fhv.player.dto.BankOverviewDTO;
import at.fhv.player.dto.CreditAssessmentDTO;

public interface BankService {
    BankOverviewDTO getOverview(String playerId);
    CreditAssessmentDTO assessCredit(String playerId);
    double interestRateFor(String creditRating, int termTicks);
}
