package at.fhv.freight.dto;

public class UnloadCargoResponseDTO {
    private int totalReward;
    private int contractsDelivered;
    private int contractsFailed;
    private int totalDeduction;
    private int maxLateTicks;
    private int ratsLoss;
    private int contractsHitByRats;

    public UnloadCargoResponseDTO() {}

    public UnloadCargoResponseDTO(int totalReward, int contractsDelivered,
                                  int contractsFailed, int totalDeduction, int maxLateTicks) {
        this(totalReward, contractsDelivered, contractsFailed, totalDeduction, maxLateTicks, 0, 0);
    }

    public UnloadCargoResponseDTO(int totalReward, int contractsDelivered,
                                  int contractsFailed, int totalDeduction, int maxLateTicks,
                                  int ratsLoss, int contractsHitByRats) {
        this.totalReward = totalReward;
        this.contractsDelivered = contractsDelivered;
        this.contractsFailed = contractsFailed;
        this.totalDeduction = totalDeduction;
        this.maxLateTicks = maxLateTicks;
        this.ratsLoss = ratsLoss;
        this.contractsHitByRats = contractsHitByRats;
    }

    public int getRatsLoss() { return ratsLoss; }
    public void setRatsLoss(int ratsLoss) { this.ratsLoss = ratsLoss; }

    public int getContractsHitByRats() { return contractsHitByRats; }
    public void setContractsHitByRats(int contractsHitByRats) { this.contractsHitByRats = contractsHitByRats; }

    public int getTotalReward() { return totalReward; }
    public void setTotalReward(int totalReward) { this.totalReward = totalReward; }

    public int getContractsDelivered() { return contractsDelivered; }
    public void setContractsDelivered(int contractsDelivered) { this.contractsDelivered = contractsDelivered; }

    public int getContractsFailed() { return contractsFailed; }
    public void setContractsFailed(int contractsFailed) { this.contractsFailed = contractsFailed; }

    public int getTotalDeduction() { return totalDeduction; }
    public void setTotalDeduction(int totalDeduction) { this.totalDeduction = totalDeduction; }

    public int getMaxLateTicks() { return maxLateTicks; }
    public void setMaxLateTicks(int maxLateTicks) { this.maxLateTicks = maxLateTicks; }
}
