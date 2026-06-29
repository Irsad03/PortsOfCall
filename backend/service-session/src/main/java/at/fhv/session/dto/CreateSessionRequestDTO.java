package at.fhv.session.dto;

public class CreateSessionRequestDTO {
    private String creatorPlayerId;
    private String creatorName;

    public CreateSessionRequestDTO() {}

    public CreateSessionRequestDTO(String creatorPlayerId, String creatorName) {
        this.creatorPlayerId = creatorPlayerId;
        this.creatorName = creatorName;
    }

    public String getCreatorPlayerId() { return creatorPlayerId; }
    public void setCreatorPlayerId(String creatorPlayerId) { this.creatorPlayerId = creatorPlayerId; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
}
