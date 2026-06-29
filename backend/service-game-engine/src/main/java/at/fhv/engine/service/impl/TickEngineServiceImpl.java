package at.fhv.engine.service.impl;

import at.fhv.engine.dto.CloseOnArrivalResponseDTO;
import at.fhv.engine.dto.CreateNewsRequestDTO;
import at.fhv.engine.dto.GameStateMessageDTO;
import at.fhv.engine.dto.MinigameEventMessageDTO;
import at.fhv.engine.dto.PilotRequestMessageDTO;
import at.fhv.engine.dto.PoliticalEventDTO;
import at.fhv.engine.dto.SessionResponseDTO;
import at.fhv.engine.dto.SessionTickResultDTO;
import at.fhv.engine.dto.ShipArrivalDTO;
import at.fhv.engine.dto.TickMessageDTO;
import at.fhv.engine.dto.WaypointUpdateDTO;
import at.fhv.engine.client.CargoClient;
import at.fhv.engine.client.LoanClient;
import at.fhv.engine.client.MortgageClient;
import at.fhv.engine.client.PlayerClient;
import at.fhv.engine.client.PoliticalEventClient;
import at.fhv.engine.client.SessionClient;
import at.fhv.engine.client.ShipClient;
import at.fhv.engine.service.GameStateService;
import at.fhv.engine.service.TickEngineService;
import at.fhv.engine.service.WebSocketBroadcaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

// Central orchestrator. Runs every game.tick.interval-ms and:
//   1. Asks session-service for active sessions, increments each one's tick.
//   2. Asks cargo-service to refill / expire contracts.
//   3. Asks ship-service to advance all sailing ships → returns events.
//   4. Applies side effects of those events (player position updates, cargo close, broadcasts).
//   5. Broadcasts the updated GameState via WebSocket.
@Service
public class TickEngineServiceImpl implements TickEngineService {

    private static final Logger log = LoggerFactory.getLogger(TickEngineServiceImpl.class);

    private final SessionClient sessionClient;
    private final PlayerClient playerClient;
    private final ShipClient shipClient;
    private final CargoClient cargoClient;
    private final LoanClient loanClient;
    private final MortgageClient mortgageClient;
    private final PoliticalEventClient politicalEventClient;
    private final GameStateService gameStateService;
    private final WebSocketBroadcaster broadcaster;

    public TickEngineServiceImpl(SessionClient sessionClient,
                                 PlayerClient playerClient,
                                 ShipClient shipClient,
                                 CargoClient cargoClient,
                                 LoanClient loanClient,
                                 MortgageClient mortgageClient,
                                 PoliticalEventClient politicalEventClient,
                                 GameStateService gameStateService,
                                 WebSocketBroadcaster broadcaster) {
        this.sessionClient = sessionClient;
        this.playerClient = playerClient;
        this.shipClient = shipClient;
        this.cargoClient = cargoClient;
        this.loanClient = loanClient;
        this.mortgageClient = mortgageClient;
        this.politicalEventClient = politicalEventClient;
        this.gameStateService = gameStateService;
        this.broadcaster = broadcaster;
    }

    @Override
    @Scheduled(fixedDelayString = "${game.tick.interval-ms:5000}")
    public void processTick() {
        List<SessionResponseDTO> activeSessions = sessionClient.getActiveSessions();
        if (activeSessions.isEmpty()) return;

        List<PoliticalEventDTO> politicalEvents = politicalEventClient.processTick();
        broadcastPoliticalEvents(activeSessions, politicalEvents);

        for (SessionResponseDTO session : activeSessions) {
            if (session.getCurrentPlayers() == 0) {
                log.info("Auto-purging empty session {} (tick {})", session.getId(), session.getCurrentTick());
                sessionClient.purgeIfEmpty(session.getId());
                continue;
            }
            try {
                processSessionTick(session);
            } catch (Exception ex) {
                log.error("Tick processing failed for session {}: {}",
                        session.getId(), ex.getMessage(), ex);
            }
        }
    }

    private void processSessionTick(SessionResponseDTO session) {
        String sessionId = session.getId();

        // 1. Increment tick on the session
        int newTick = sessionClient.incrementTick(sessionId);
        if (newTick < 0) {
            log.warn("Skipping tick for session {} – session-service did not return a tick", sessionId);
            return;
        }

        // 2. Refill cargo contracts (also drops expired ones internally)
        cargoClient.refillContracts(sessionId, newTick);

        // 2b. Auto-debit due loan instalments for this session's players
        loanClient.processTick(sessionId, newTick);

        // 2c. Auto-debit due mortgage instalments (and seize ships on default)
        mortgageClient.processTick(sessionId, newTick);

        // 3. Process ship movements – ship-service emits arrival/waypoint/pilot events
        SessionTickResultDTO tickResult = shipClient.processTickForSession(sessionId, newTick);

        // 4. Apply cross-service side effects
        applyArrivals(sessionId, newTick, tickResult.getArrivals());
        applyWaypointUpdates(tickResult.getWaypointUpdates());
        broadcastPilotRequests(sessionId, tickResult.getPilotRequests());
        broadcastMinigameEvents(sessionId, tickResult.getMinigameEvents());

        // 5. Build the aggregated game state FIRST, then broadcast both messages.
        // Building before broadcasting keeps the tick counter and the ship
        // snapshot in lockstep: if state-building ever fails, we skip BOTH
        // broadcasts for this tick instead of advancing the counter while the
        // ships freeze (they'd just resume on the next successful tick)

        session.setCurrentTick(newTick);
        GameStateMessageDTO state = gameStateService.buildGameState(session);
        broadcaster.broadcastTick(sessionId, new TickMessageDTO(sessionId, newTick));
        broadcaster.broadcastGameState(sessionId, state);

        log.info("Tick {} processed for session {} ({} arrivals, {} waypoint moves, {} pilot requests)",
                newTick, sessionId,
                tickResult.getArrivals().size(),
                tickResult.getWaypointUpdates().size(),
                tickResult.getPilotRequests().size());
    }

    private void applyArrivals(String sessionId, int currentTick, List<ShipArrivalDTO> arrivals) {
        if (arrivals == null || arrivals.isEmpty()) return;
        for (ShipArrivalDTO arrival : arrivals) {
            playerClient.updatePosition(arrival.getPlayerId(),
                    arrival.getArrivedX(), arrival.getArrivedY());

            CloseOnArrivalResponseDTO closed = cargoClient.closeOnArrival(
                    arrival.getShipId(), arrival.getArrivedPortId(), currentTick);
            if (closed.getProfit() > 0) {
                log.info("Ship {} delivered {} contracts at {} → +{}$ for player {}",
                        arrival.getShipId(), closed.getContractsClosed(),
                        arrival.getArrivedPortId(), closed.getProfit(), arrival.getPlayerId());
            }
        }
    }

    private void applyWaypointUpdates(List<WaypointUpdateDTO> updates) {
        if (updates == null || updates.isEmpty()) return;
        for (WaypointUpdateDTO upd : updates) {
            playerClient.updatePosition(upd.getPlayerId(), upd.getX(), upd.getY());
        }
    }

    private void broadcastPilotRequests(String sessionId, List<PilotRequestMessageDTO> requests) {
        if (requests == null || requests.isEmpty()) return;
        for (PilotRequestMessageDTO req : requests) {
            broadcaster.broadcastPilotRequest(sessionId, req);
            log.info("Pilot request broadcast for ship {} (player {})",
                    req.getShipId(), req.getPlayerId());
        }
    }

    private void broadcastPoliticalEvents(List<SessionResponseDTO> activeSessions,
                                          List<PoliticalEventDTO> events) {
        if (events == null || events.isEmpty()) return;
        for (SessionResponseDTO session : activeSessions) {
            for (PoliticalEventDTO event : events) {
                broadcaster.broadcastPoliticalEvent(session.getId(), event);

                sessionClient.postNews(session.getId(), toNews(session, event));
            }
        }
        log.info("Political-event broadcast: {} event(s) to {} session(s)",
                events.size(), activeSessions.size());
    }

    private CreateNewsRequestDTO toNews(SessionResponseDTO session, PoliticalEventDTO event) {
        StringBuilder body = new StringBuilder();
        if (event.getReason() != null && !event.getReason().isBlank()) {
            body.append(event.getReason());
        }
        switch (event.getType()) {
            case ROUTE_BLOCKED -> {
                Integer grace = event.getGracePeriodTicks();
                if (grace != null && grace > 0) {
                    appendSentence(body, "The blockade takes effect in " + grace
                            + " day" + (grace == 1 ? "" : "s") + ".");
                }
                Integer duration = event.getDurationTicks();
                if (duration != null && duration > 0) {
                    appendSentence(body, "Authorities expect it to last " + duration + " days.");
                }
                appendSentence(body, event.isAlternativeAvailable()
                        ? "An alternative route has been cleared for civilian shipping."
                        : "No alternative route is available — captains must wait it out.");
            }
            case ROUTE_ENFORCED -> appendSentence(body,
                    "The blockade is now in force. Affected passages are closed to all traffic.");
            case ROUTE_UNBLOCKED -> appendSentence(body,
                    "The affected passages have reopened and shipping resumes as normal.");
        }

        List<String> portIds = event.getAffectedRoutes() == null ? List.of()
                : event.getAffectedRoutes().stream()
                        .flatMap(p -> java.util.stream.Stream.of(p.getFromPortId(), p.getToPortId()))
                        .filter(id -> id != null)
                        .distinct()
                        .toList();

        String headline = event.getHeadline() != null && !event.getHeadline().isBlank()
                ? event.getHeadline()
                : "Political development affects shipping routes";

        return new CreateNewsRequestDTO(session.getCurrentTick(), headline,
                body.toString(), "POLITICS", portIds);
    }

    private static void appendSentence(StringBuilder sb, String sentence) {
        if (sb.length() > 0) sb.append(' ');
        sb.append(sentence);
    }

    private void broadcastMinigameEvents(String sessionId, List<MinigameEventMessageDTO> events) {
        if (events == null || events.isEmpty()) return;
        for (MinigameEventMessageDTO event : events) {
            broadcaster.broadcastMinigameEvent(sessionId, event);
            log.info("Minigame event broadcast for ship {} (player {})",
                    event.getShipId(), event.getPlayerId());
        }
    }
}