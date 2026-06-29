package at.fhv.freight.dto;

public class ForfeitContractResponseDTO {
    private int penalty;
    private int newBalance;

    public ForfeitContractResponseDTO() {}

    public ForfeitContractResponseDTO(int penalty, int newBalance) {
        this.penalty = penalty;
        this.newBalance = newBalance;
    }

    public int getPenalty() { return penalty; }
    public void setPenalty(int penalty) { this.penalty = penalty; }

    public int getNewBalance() { return newBalance; }
    public void setNewBalance(int newBalance) { this.newBalance = newBalance; }
}
