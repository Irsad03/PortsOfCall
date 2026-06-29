package at.fhv.session.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastLobbyEvent(String sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/lobby/" + sessionId + "/players", payload);
    }

    public void broadcastEndGameVote(String sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/end-game-vote", payload);
    }

    public void broadcastGameOver(String sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/end-game", payload);
    }
}
