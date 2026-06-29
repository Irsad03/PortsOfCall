package at.fhv.freight.cargo.service;

import at.fhv.freight.dto.ContractFailedEventDTO;
import at.fhv.freight.dto.RewardEventDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastReward(String sessionId, RewardEventDTO event) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/rewards", event);
    }

    public void broadcastCargoRefresh(String sessionId) {
        Object payload = java.util.Map.of("event", "CARGO_REFRESH");
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/cargo-refresh", payload);
    }

    public void broadcastContractFailed(String sessionId, ContractFailedEventDTO event) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId + "/contract-failed", event);
    }
}
