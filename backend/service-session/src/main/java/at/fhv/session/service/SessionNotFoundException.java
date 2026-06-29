package at.fhv.session.service;

import at.fhv.session.exception.EntityNotFoundException;

public class SessionNotFoundException extends EntityNotFoundException {
    public SessionNotFoundException(String message) {
        super(message);
    }
}
