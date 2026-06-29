package at.fhv.navigation.route.controller;

import at.fhv.navigation.dto.RouteDTO;
import at.fhv.navigation.route.service.RouteNotFoundException;
import at.fhv.navigation.route.service.RouteService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/{id}")
    public RouteDTO getRouteById(@PathVariable String id) {
        return routeService.findById(id);
    }

    @GetMapping("/find")
    public RouteDTO findRoute(@RequestParam("from") String fromPortId,
                              @RequestParam("to") String toPortId) {
        return routeService.findByFromAndTo(fromPortId, toPortId)
                .orElseThrow(() -> new RouteNotFoundException(
                        "No route from " + fromPortId + " to " + toPortId));
    }
}