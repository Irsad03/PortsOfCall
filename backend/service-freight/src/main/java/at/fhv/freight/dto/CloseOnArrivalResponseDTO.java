package at.fhv.freight.dto;

// Returned by service-cargo when closing ACCEPTED contracts after a ship's arrival.
// Profit reflects late penalties already applied.
public class CloseOnArrivalResponseDTO {
    private int profit;
    private int contractsClosed;

    public CloseOnArrivalResponseDTO() {}

    public CloseOnArrivalResponseDTO(int profit, int contractsClosed) {
        this.profit = profit;
        this.contractsClosed = contractsClosed;
    }

    public int getProfit() { return profit; }
    public void setProfit(int profit) { this.profit = profit; }

    public int getContractsClosed() { return contractsClosed; }
    public void setContractsClosed(int contractsClosed) { this.contractsClosed = contractsClosed; }
}
