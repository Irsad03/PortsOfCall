package at.fhv.freight.cargo.model;

import at.fhv.freight.dto.CargoStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "cargo_contracts")
public class CargoContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Version
    private Long version;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    private String description;
    private int reward;
    private int requiredCapacity;

    @Column(name = "origin_port_id", nullable = false)
    private String originPortId;

    @Column(name = "destination_port_id", nullable = false)
    private String destinationPortId;

    private Integer createdAtTick;
    private Integer expiresAtTick;
    private String riskLevel;

    @Column(nullable = false)
    private boolean illegal = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CargoStatus status = CargoStatus.OPEN;

    @Column(name = "assigned_ship_id")
    private String assignedShipId;

    /** Cumulative € lost from this contract's reward to rats-on-board damage. */
    @Column(nullable = false)
    private int ratsValueLoss = 0;

    public CargoContract() {}

    public CargoContract(String sessionId, String description, int reward, int requiredCapacity,
                         String originPortId, String destinationPortId, String riskLevel) {
        this.sessionId = sessionId;
        this.description = description;
        this.reward = reward;
        this.requiredCapacity = requiredCapacity;
        this.originPortId = originPortId;
        this.destinationPortId = destinationPortId;
        this.riskLevel = riskLevel;
        this.status = CargoStatus.OPEN;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getReward() { return reward; }
    public void setReward(int reward) { this.reward = reward; }

    public int getRequiredCapacity() { return requiredCapacity; }
    public void setRequiredCapacity(int requiredCapacity) { this.requiredCapacity = requiredCapacity; }

    public String getOriginPortId() { return originPortId; }
    public void setOriginPortId(String originPortId) { this.originPortId = originPortId; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }

    public Integer getCreatedAtTick() { return createdAtTick; }
    public void setCreatedAtTick(Integer createdAtTick) { this.createdAtTick = createdAtTick; }

    public Integer getExpiresAtTick() { return expiresAtTick; }
    public void setExpiresAtTick(Integer expiresAtTick) { this.expiresAtTick = expiresAtTick; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public boolean isIllegal() { return illegal; }
    public void setIllegal(boolean illegal) { this.illegal = illegal; }

    public CargoStatus getStatus() { return status; }
    public void setStatus(CargoStatus status) { this.status = status; }

    public String getAssignedShipId() { return assignedShipId; }
    public void setAssignedShipId(String assignedShipId) { this.assignedShipId = assignedShipId; }

    public int getRatsValueLoss() { return ratsValueLoss; }
    public void setRatsValueLoss(int ratsValueLoss) { this.ratsValueLoss = ratsValueLoss; }
}
