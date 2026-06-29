package at.fhv.freight.ship.service;

import at.fhv.freight.exception.EntityNotFoundException;

public class ShipNotFoundException extends EntityNotFoundException {
    public ShipNotFoundException(String message) {
        super(message);
    }
}
