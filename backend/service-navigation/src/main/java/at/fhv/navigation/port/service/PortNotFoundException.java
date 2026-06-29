package at.fhv.navigation.port.service;

import at.fhv.navigation.exception.EntityNotFoundException;

public class PortNotFoundException extends EntityNotFoundException {
    public PortNotFoundException(String message) {
        super(message);
    }
}