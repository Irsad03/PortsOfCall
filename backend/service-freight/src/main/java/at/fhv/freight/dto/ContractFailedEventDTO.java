package at.fhv.freight.dto;

public class ContractFailedEventDTO {
    private String contractId;
    private String playerId;
    private String playerName;
    private int penalty;
    private int newBalance;
    private String reason;
    private String description;
    private int lateTicks;

    public ContractFailedEventDTO() {}

    public ContractFailedEventDTO(String contractId, String playerId, String playerName,
                                  int penalty, int newBalance, String reason,
                                  String description, int lateTicks) {
        this.contractId = contractId;
        this.playerId = playerId;
        this.playerName = playerName;
        this.penalty = penalty;
        this.newBalance = newBalance;
        this.reason = reason;
        this.description = description;
        this.lateTicks = lateTicks;
    }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public int getPenalty() { return penalty; }
    public void setPenalty(int penalty) { this.penalty = penalty; }

    public int getNewBalance() { return newBalance; }
    public void setNewBalance(int newBalance) { this.newBalance = newBalance; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getLateTicks() { return lateTicks; }
    public void setLateTicks(int lateTicks) { this.lateTicks = lateTicks; }
}
