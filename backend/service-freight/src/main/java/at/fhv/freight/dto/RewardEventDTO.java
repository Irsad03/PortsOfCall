package at.fhv.freight.dto;

public class RewardEventDTO {
    private String playerId;
    private String playerName;
    private int profit;
    private int newBalance;

    public RewardEventDTO() {}

    public RewardEventDTO(String playerId, String playerName, int profit, int newBalance) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.profit = profit;
        this.newBalance = newBalance;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public int getProfit() { return profit; }
    public void setProfit(int profit) { this.profit = profit; }

    public int getNewBalance() { return newBalance; }
    public void setNewBalance(int newBalance) { this.newBalance = newBalance; }
}
