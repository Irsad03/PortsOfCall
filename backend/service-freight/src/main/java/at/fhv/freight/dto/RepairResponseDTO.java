package at.fhv.freight.dto;

public class RepairResponseDTO {
    private int healthPoints;
    private int remainingMoney;
    private int repairCost;

    public RepairResponseDTO() {}

    public RepairResponseDTO(int healthPoints, int remainingMoney, int repairCost) {
        this.healthPoints = healthPoints;
        this.remainingMoney = remainingMoney;
        this.repairCost = repairCost;
    }

    public int getHealthPoints() { return healthPoints; }
    public void setHealthPoints(int healthPoints) { this.healthPoints = healthPoints; }

    public int getRemainingMoney() { return remainingMoney; }
    public void setRemainingMoney(int remainingMoney) { this.remainingMoney = remainingMoney; }

    public int getRepairCost() { return repairCost; }
    public void setRepairCost(int repairCost) { this.repairCost = repairCost; }
}
