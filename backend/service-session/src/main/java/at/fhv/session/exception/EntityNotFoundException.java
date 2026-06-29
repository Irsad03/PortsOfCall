package at.fhv.session.exception;

public class EntityNotFoundException extends DomainException {
    public EntityNotFoundException(String entity, String id) {
        super(entity + " not found: " + id);
    }

    public EntityNotFoundException(String message) {
        super(message);
    }
}
