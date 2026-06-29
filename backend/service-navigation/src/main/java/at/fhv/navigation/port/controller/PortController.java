package at.fhv.navigation.port.controller;

import at.fhv.navigation.dto.PortDTO;
import at.fhv.navigation.port.service.PortService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ports")
public class PortController {

    private final PortService portService;

    public PortController(PortService portService) {
        this.portService = portService;
    }

    @GetMapping
    public ResponseEntity<List<PortDTO>> getAllPorts() {
        return ResponseEntity.ok(portService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortDTO> getPortById(@PathVariable String id) {
        return ResponseEntity.ok(portService.findById(id));
    }
}