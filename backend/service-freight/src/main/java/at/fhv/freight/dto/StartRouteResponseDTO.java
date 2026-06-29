package at.fhv.freight.dto;

public class StartRouteResponseDTO {
    private String routeId;
    private int totalTicks;
    private String destinationPortId;
    private String destinationPortName;

    private SmugglingOfferDTO pendingSmugglingOffer;

    public StartRouteResponseDTO() {}

    public StartRouteResponseDTO(String routeId, int totalTicks,
                                 String destinationPortId, String destinationPortName) {
        this.routeId = routeId;
        this.totalTicks = totalTicks;
        this.destinationPortId = destinationPortId;
        this.destinationPortName = destinationPortName;
    }

    public static StartRouteResponseDTO pendingOffer(SmugglingOfferDTO offer, String destinationPortName) {
        StartRouteResponseDTO dto = new StartRouteResponseDTO();
        dto.destinationPortId = offer.getDestinationPortId();
        dto.destinationPortName = destinationPortName;
        dto.pendingSmugglingOffer = offer;
        return dto;
    }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public int getTotalTicks() { return totalTicks; }
    public void setTotalTicks(int totalTicks) { this.totalTicks = totalTicks; }

    public String getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(String destinationPortId) { this.destinationPortId = destinationPortId; }

    public String getDestinationPortName() { return destinationPortName; }
    public void setDestinationPortName(String destinationPortName) { this.destinationPortName = destinationPortName; }

    public SmugglingOfferDTO getPendingSmugglingOffer() { return pendingSmugglingOffer; }
    public void setPendingSmugglingOffer(SmugglingOfferDTO pendingSmugglingOffer) { this.pendingSmugglingOffer = pendingSmugglingOffer; }
}
