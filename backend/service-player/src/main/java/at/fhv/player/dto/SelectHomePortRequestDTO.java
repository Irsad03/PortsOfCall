package at.fhv.player.dto;

public class SelectHomePortRequestDTO {
    private String portId;

    public SelectHomePortRequestDTO() {}

    public SelectHomePortRequestDTO(String portId) {
        this.portId = portId;
    }

    public String getPortId() { return portId; }
    public void setPortId(String portId) { this.portId = portId; }
}
