package at.fhv.session.dto;

public class LeaderboardEntryDTO {
    private String playerId;
    private String name;
    private int money;

    public LeaderboardEntryDTO() {}

    public LeaderboardEntryDTO(String playerId, String name, int money) {
        this.playerId = playerId;
        this.name = name;
        this.money = money;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getMoney() { return money; }
    public void setMoney(int money) { this.money = money; }
}
