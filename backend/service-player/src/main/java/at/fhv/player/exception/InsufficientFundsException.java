package at.fhv.player.exception;

public class InsufficientFundsException extends BusinessRuleViolationException {
    public InsufficientFundsException(String purpose, int required, int available) {
        super("Insufficient funds: " + purpose + " costs " + required
                + " Taler but your balance is only " + available + " Taler.");
    }

    public InsufficientFundsException(String message) {
        super(message);
    }
}