package at.fhv.freight.customs.service;

import at.fhv.freight.dto.BribeResultDTO;
import at.fhv.freight.dto.CustomsInspectionDTO;
import at.fhv.freight.dto.CustomsStatusDTO;
import at.fhv.freight.dto.InspectionResultDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class CustomsWebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public CustomsWebSocketBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastInspectionTriggered(String sessionId, String playerId, CustomsInspectionDTO dto) {
        messagingTemplate.convertAndSend(
                "/topic/customs/" + sessionId + "/" + playerId, dto);
    }

    public void broadcastInspectionResult(String sessionId, String playerId, InspectionResultDTO dto) {
        messagingTemplate.convertAndSend(
                "/topic/customs/" + sessionId + "/" + playerId + "/result", dto);
    }

    public void broadcastBribeResult(String sessionId, String playerId, BribeResultDTO dto) {
        messagingTemplate.convertAndSend(
                "/topic/customs/" + sessionId + "/" + playerId + "/result", dto);
    }

    public void broadcastStatusUpdate(String sessionId, CustomsStatusDTO dto) {
        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId + "/customs-status", dto);
    }
}
