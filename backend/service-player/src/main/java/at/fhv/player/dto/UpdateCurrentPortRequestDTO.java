package at.fhv.player.dto;

public class UpdateCurrentPortRequestDTO {
    private String portId;

    public UpdateCurrentPortRequestDTO() {}

    public UpdateCurrentPortRequestDTO(String portId) {
        this.portId = portId;
    }

    public String getPortId() { return portId; }
    public void setPortId(String portId) { this.portId = portId; }
}