package at.fhv.engine.service;

import at.fhv.engine.dto.GameStateMessageDTO;
import at.fhv.engine.dto.MinigameEventMessageDTO;
import at.fhv.engine.dto.PilotRequestMessageDTO;
import at.fhv.engine.dto.PoliticalEventDTO;
import at.fhv.engine.dto.TickMessageDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastTick(String sessionId, TickMessageDTO message) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/tick", message);
    }

    public void broadcastGameState(String sessionId, GameStateMessageDTO message) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/state", message);
    }

    public void broadcastPilotRequest(String sessionId, PilotRequestMessageDTO request) {
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/player/" + request.getPlayerId() + "/pilot-request",
            request
        );
    }

    public void broadcastMinigameEvent(String sessionId, MinigameEventMessageDTO event) {
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/minigame-event",
            event
        );
    }

    public void broadcastPoliticalEvent(String sessionId, PoliticalEventDTO event) {
        messagingTemplate.convertAndSend(
            "/topic/game/" + sessionId + "/political-event",
            event
        );
    }
}