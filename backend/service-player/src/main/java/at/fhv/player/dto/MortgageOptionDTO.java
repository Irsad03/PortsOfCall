package at.fhv.player.dto;

public class MortgageOptionDTO {

    private String  shipId;
    private String  shipName;
    private String  shipClass;
    private int     shipValue;
    private int     maxMortgage;
    private boolean eligible;
    private String  ineligibleReason;

    public MortgageOptionDTO() {}

    public MortgageOptionDTO(String shipId, String shipName, String shipClass,
                             int shipValue, int maxMortgage,
                             boolean eligible, String ineligibleReason) {
        this.shipId           = shipId;
        this.shipName         = shipName;
        this.shipClass        = shipClass;
        this.shipValue        = shipValue;
        this.maxMortgage      = maxMortgage;
        this.eligible         = eligible;
        this.ineligibleReason = ineligibleReason;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }

    public String getShipClass() { return shipClass; }
    public void setShipClass(String shipClass) { this.shipClass = shipClass; }

    public int getShipValue() { return shipValue; }
    public void setShipValue(int shipValue) { this.shipValue = shipValue; }

    public int getMaxMortgage() { return maxMortgage; }
    public void setMaxMortgage(int maxMortgage) { this.maxMortgage = maxMortgage; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getIneligibleReason() { return ineligibleReason; }
    public void setIneligibleReason(String ineligibleReason) { this.ineligibleReason = ineligibleReason; }
}
