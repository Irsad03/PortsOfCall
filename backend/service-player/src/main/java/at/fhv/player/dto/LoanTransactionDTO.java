package at.fhv.player.dto;

import at.fhv.player.model.LoanTransaction;

public class LoanTransactionDTO {

    private String id;
    private String loanId;
    private int    tick;
    private String type;
    private int    amount;
    private int    balanceAfter;
    private String description;

    public LoanTransactionDTO() {}

    public static LoanTransactionDTO from(LoanTransaction t) {
        LoanTransactionDTO dto = new LoanTransactionDTO();
        dto.id           = t.getId();
        dto.loanId       = t.getLoanId();
        dto.tick         = t.getTick();
        dto.type         = t.getType().name();
        dto.amount       = t.getAmount();
        dto.balanceAfter = t.getBalanceAfter();
        dto.description  = t.getDescription();
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }

    public int getTick() { return tick; }
    public void setTick(int tick) { this.tick = tick; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
