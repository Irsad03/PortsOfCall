package at.fhv.freight.dto;

public class AcceptCargoRequestDTO {
    private String playerId;
    private String contractId;
    private String shipId;

    public AcceptCargoRequestDTO() {}

    public AcceptCargoRequestDTO(String playerId, String contractId, String shipId) {
        this.playerId = playerId;
        this.contractId = contractId;
        this.shipId = shipId;
    }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }
}
