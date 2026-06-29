package at.fhv.navigation.route.service;

import at.fhv.navigation.exception.EntityNotFoundException;

public class RouteNotFoundException extends EntityNotFoundException {
    public RouteNotFoundException(String message) {
        super(message);
    }
}