package at.fhv.freight.dto;

import java.util.List;

public class InspectionResultDTO {
    private boolean detected;
    private List<String> confiscatedContractIds;
    private int totalFine;
    private int holdTicks;

    public InspectionResultDTO() {}

    public boolean isDetected() { return detected; }
    public void setDetected(boolean detected) { this.detected = detected; }

    public List<String> getConfiscatedContractIds() { return confiscatedContractIds; }
    public void setConfiscatedContractIds(List<String> confiscatedContractIds) { this.confiscatedContractIds = confiscatedContractIds; }

    public int getTotalFine() { return totalFine; }
    public void setTotalFine(int totalFine) { this.totalFine = totalFine; }

    public int getHoldTicks() { return holdTicks; }
    public void setHoldTicks(int holdTicks) { this.holdTicks = holdTicks; }
}
