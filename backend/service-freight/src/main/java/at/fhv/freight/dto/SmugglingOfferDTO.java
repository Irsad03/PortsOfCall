package at.fhv.freight.dto;

public class SmugglingOfferDTO {

    private String offerId;
    private String description;
    private int reward;
    private int requiredCapacity;
    private String originPortId;
    private String destinationPortId;
    private String riskLevel;

    public SmugglingOfferDTO() {}

    public SmugglingOfferDTO(String offerId, String description, int reward, int requiredCapacity,
                             String originPortId, String destinationPortId, String riskLevel) {
        this.offerId = offerId;
        this.description = description;
        this.reward = reward;
        this.requiredCapacity = requiredCapacity;
        this.originPortId = originPortId;
        this.destinationPortId = destinationPortId;
        this.riskLevel = riskLevel;
    }

    public String getOfferId() { return offerId; }
    public void setOfferId(String offerId) { this.offerId = offerId; }

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

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}
