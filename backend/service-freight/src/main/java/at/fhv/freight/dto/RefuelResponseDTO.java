package at.fhv.freight.dto;

public class RefuelResponseDTO {
    private int fuelLevel;
    private int remainingMoney;
    private int cost;

    public RefuelResponseDTO() {}

    public RefuelResponseDTO(int fuelLevel, int remainingMoney, int cost) {
        this.fuelLevel = fuelLevel;
        this.remainingMoney = remainingMoney;
        this.cost = cost;
    }

    public int getFuelLevel() { return fuelLevel; }
    public void setFuelLevel(int fuelLevel) { this.fuelLevel = fuelLevel; }

    public int getRemainingMoney() { return remainingMoney; }
    public void setRemainingMoney(int remainingMoney) { this.remainingMoney = remainingMoney; }

    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }
}
