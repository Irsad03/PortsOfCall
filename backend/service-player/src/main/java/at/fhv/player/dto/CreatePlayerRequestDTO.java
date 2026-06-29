package at.fhv.player.dto;

public class CreatePlayerRequestDTO {
    private String name;
    private String sessionId;
    private Integer startingMoney;

    public CreatePlayerRequestDTO() {}

    public CreatePlayerRequestDTO(String name, String sessionId, Integer startingMoney) {
        this.name = name;
        this.sessionId = sessionId;
        this.startingMoney = startingMoney;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Integer getStartingMoney() { return startingMoney; }
    public void setStartingMoney(Integer startingMoney) { this.startingMoney = startingMoney; }
}
