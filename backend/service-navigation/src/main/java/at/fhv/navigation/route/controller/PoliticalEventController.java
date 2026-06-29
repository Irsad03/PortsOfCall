package at.fhv.navigation.route.controller;

import at.fhv.navigation.dto.PoliticalEventDTO;
import at.fhv.navigation.route.service.PoliticalEventService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/political-events")
public class PoliticalEventController {

    private final PoliticalEventService service;

    public PoliticalEventController(PoliticalEventService service) {
        this.service = service;
    }

    @PostMapping("/tick")
    public List<PoliticalEventDTO> processTick() {
        return service.processTick();
    }

    @GetMapping("/blocked")
    public List<PoliticalEventDTO.PortPair> getBlocked() {
        return service.getCurrentlyBlockedRoutes();
    }

    @GetMapping("/pilot-strikes")
    public List<String> getPilotStrikes() {
        return service.getCurrentPilotStrikePortIds();
    }
}
