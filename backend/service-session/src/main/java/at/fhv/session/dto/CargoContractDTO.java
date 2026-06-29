package at.fhv.session.dto;

public class CargoContractDTO {
    private String id;
    private String description;
    private int reward;
    private int requiredCapacity;
    private String originPortId;
    private String originPortName;
    private String destinationPortId;
    private String destinationPortName;
    private String riskLevel;
    private Integer expiresAtTick;
    private CargoStatus status;
    private String assignedShipId;

    public CargoContractDTO() {}

    public CargoContractDTO(String id, String description, int reward, int requiredCapacity,
                            String originPortId, String originPortName,
                            String destinationPortId, String destinationPortName,
                            String riskLevel, Integer expiresAtTick,
                            CargoStatus status, String assignedShipId) {
        this.id = id;
        this.description = description;
        this.reward = reward;
        this.requiredCapacity = requiredCapacity;
        this.originPortId = originPortId;
        this.originPortName = originPortName;
        this.destinationPortId = destinationPortId;
        this.destinationPortName = destinationPortName;
        this.riskLevel = riskLevel;
        this.expiresAtTick = expiresAtTick;
        this.status = status;
        this.assignedShipId = assignedShipId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getReward() { return reward; }
    public void setReward(int reward) { this.reward = reward; }

    public int getRequiredCapacity() { return requiredCapacity; }
    public void setRequiredCapacity(int requiredCapacity) { this.requiredCapacity = requiredCapacity; }

    public String getOriginPortId() { return originPortId; }
    public void setOriginPortId(String originPortId) { this.originPortId = originPortId; }

    public String getOriginPortName() { return originPortName; }
    public void setOriginPortName(String originPortName) { this.originPortName = originPortName; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }

    public String getDestinationPortName() { return destinationPortName; }
    public void setDestinationPortName(String destinationPortName) { this.destinationPortName = destinationPortName; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Integer getExpiresAtTick() { return expiresAtTick; }
    public void setExpiresAtTick(Integer expiresAtTick) { this.expiresAtTick = expiresAtTick; }

    public CargoStatus getStatus() { return status; }
    public void setStatus(CargoStatus status) { this.status = status; }

    public String getAssignedShipId() { return assignedShipId; }
    public void setAssignedShipId(String assignedShipId) { this.assignedShipId = assignedShipId; }
}
