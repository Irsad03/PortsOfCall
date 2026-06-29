package at.fhv.freight.dto;

public class HirePilotResponseDTO {
    private boolean hasPilot;
    private int remainingMoney;
    private int cost;

    public HirePilotResponseDTO() {}

    public HirePilotResponseDTO(boolean hasPilot, int remainingMoney, int cost) {
        this.hasPilot = hasPilot;
        this.remainingMoney = remainingMoney;
        this.cost = cost;
    }

    public boolean isHasPilot() { return hasPilot; }
    public void setHasPilot(boolean hasPilot) { this.hasPilot = hasPilot; }

    public int getRemainingMoney() { return remainingMoney; }
    public void setRemainingMoney(int remainingMoney) { this.remainingMoney = remainingMoney; }

    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }
}
