package at.fhv.freight.dto;

import java.util.List;

public class SessionTickResultDTO {
    private List<ShipArrivalDTO> arrivals;
    private List<WaypointUpdateDTO> waypointUpdates;
    private List<PilotRequestMessageDTO> pilotRequests;
    private List<MinigameEventMessageDTO> minigameEvents;

    public SessionTickResultDTO() {}

    public SessionTickResultDTO(List<ShipArrivalDTO> arrivals,
                                List<WaypointUpdateDTO> waypointUpdates,
                                List<PilotRequestMessageDTO> pilotRequests,
                                List<MinigameEventMessageDTO> minigameEvents) {
        this.arrivals = arrivals;
        this.waypointUpdates = waypointUpdates;
        this.pilotRequests = pilotRequests;
        this.minigameEvents = minigameEvents;
    }

    public List<ShipArrivalDTO> getArrivals() { return arrivals; }
    public void setArrivals(List<ShipArrivalDTO> arrivals) { this.arrivals = arrivals; }

    public List<WaypointUpdateDTO> getWaypointUpdates() { return waypointUpdates; }
    public void setWaypointUpdates(List<WaypointUpdateDTO> waypointUpdates) { this.waypointUpdates = waypointUpdates; }

    public List<PilotRequestMessageDTO> getPilotRequests() { return pilotRequests; }
    public void setPilotRequests(List<PilotRequestMessageDTO> pilotRequests) { this.pilotRequests = pilotRequests; }

    public List<MinigameEventMessageDTO> getMinigameEvents() { return minigameEvents; }
    public void setMinigameEvents(List<MinigameEventMessageDTO> minigameEvents) { this.minigameEvents = minigameEvents; }
}
