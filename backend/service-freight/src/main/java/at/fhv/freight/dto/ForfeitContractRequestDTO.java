package at.fhv.freight.dto;

public class ForfeitContractRequestDTO {
    private String playerId;
    private String shipId;
    private String contractId;

    public ForfeitContractRequestDTO() {}

    public ForfeitContractRequestDTO(String playerId, String shipId, String contractId) {
        this.playerId = playerId;
        this.shipId = shipId;
        this.contractId = contractId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
}
