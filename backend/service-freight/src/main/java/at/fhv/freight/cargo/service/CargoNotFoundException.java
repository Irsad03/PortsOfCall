package at.fhv.freight.cargo.service;

import at.fhv.freight.exception.EntityNotFoundException;

public class CargoNotFoundException extends EntityNotFoundException {
    public CargoNotFoundException(String message) {
        super(message);
    }
}
