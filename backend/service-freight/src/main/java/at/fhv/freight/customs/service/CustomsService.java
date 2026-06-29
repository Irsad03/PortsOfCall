package at.fhv.freight.customs.service;

import at.fhv.freight.dto.CustomsStatusDTO;
import at.fhv.freight.ship.model.PlayerShip;

public interface CustomsService {

    void triggerIfApplicable(PlayerShip ship);

    CustomsStatusDTO submitToInspection(String shipId, String playerId);

    CustomsStatusDTO offerBribe(String shipId, String playerId, int bribeAmount);

    CustomsStatusDTO getStatus(String shipId);

    void processHoldTick(String sessionId);
}
