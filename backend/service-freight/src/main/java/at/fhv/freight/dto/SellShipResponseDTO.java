package at.fhv.freight.dto;

public class SellShipResponseDTO {
    private String shipId;
    private int salePrice;
    private int newBalance;
    private String marketShipId;

    public SellShipResponseDTO() {}

    public SellShipResponseDTO(String shipId, int salePrice, int newBalance, String marketShipId) {
        this.shipId = shipId;
        this.salePrice = salePrice;
        this.newBalance = newBalance;
        this.marketShipId = marketShipId;
    }

    public String getShipId() { return shipId; }
    public void setShipId(String shipId) { this.shipId = shipId; }

    public int getSalePrice() { return salePrice; }
    public void setSalePrice(int salePrice) { this.salePrice = salePrice; }

    public int getNewBalance() { return newBalance; }
    public void setNewBalance(int newBalance) { this.newBalance = newBalance; }

    public String getMarketShipId() { return marketShipId; }
    public void setMarketShipId(String marketShipId) { this.marketShipId = marketShipId; }
}
