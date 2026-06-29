package at.fhv.session.dto;

public class VoteEndGameRequestDTO {
    private String playerId;
    private boolean vote;

    public VoteEndGameRequestDTO() {}

    public VoteEndGameRequestDTO(String playerId, boolean vote) {
        this.playerId = playerId;
        this.vote = vote;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public boolean isVote() { return vote; }
    public void setVote(boolean vote) { this.vote = vote; }
}
