package at.fhv.freight.smuggling.service;

import at.fhv.freight.dto.SmugglingOfferDTO;
import at.fhv.freight.ship.model.PlayerShip;

public interface SmugglingService {

    SmugglingOfferDTO maybeGenerateOffer(PlayerShip ship, String destinationPortId);

    String acceptOffer(String shipId, String playerId);

    void rejectOffer(String shipId, String playerId);
}
