package at.fhv.freight.dto;

import java.util.List;

public class BribeResultDTO {
    private boolean accepted;
    private int bribeAmount;
    private int threshold;
    private double successProbability;
    private boolean penaltyApplied;
    private int totalFine;
    private List<String> confiscatedContractIds;
    private int holdTicks;

    public BribeResultDTO() {}

    public boolean isAccepted() { return accepted; }
    public void setAccepted(boolean accepted) { this.accepted = accepted; }

    public int getBribeAmount() { return bribeAmount; }
    public void setBribeAmount(int bribeAmount) { this.bribeAmount = bribeAmount; }

    public int getThreshold() { return threshold; }
    public void setThreshold(int threshold) { this.threshold = threshold; }

    public double getSuccessProbability() { return successProbability; }
    public void setSuccessProbability(double successProbability) { this.successProbability = successProbability; }

    public boolean isPenaltyApplied() { return penaltyApplied; }
    public void setPenaltyApplied(boolean penaltyApplied) { this.penaltyApplied = penaltyApplied; }

    public int getTotalFine() { return totalFine; }
    public void setTotalFine(int totalFine) { this.totalFine = totalFine; }

    public List<String> getConfiscatedContractIds() { return confiscatedContractIds; }
    public void setConfiscatedContractIds(List<String> confiscatedContractIds) { this.confiscatedContractIds = confiscatedContractIds; }

    public int getHoldTicks() { return holdTicks; }
    public void setHoldTicks(int holdTicks) { this.holdTicks = holdTicks; }
}
