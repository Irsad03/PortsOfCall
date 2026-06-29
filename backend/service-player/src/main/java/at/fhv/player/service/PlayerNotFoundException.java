package at.fhv.player.service;

import at.fhv.player.exception.EntityNotFoundException;

public class PlayerNotFoundException extends EntityNotFoundException {
    public PlayerNotFoundException(String message) {
        super(message);
    }
}
