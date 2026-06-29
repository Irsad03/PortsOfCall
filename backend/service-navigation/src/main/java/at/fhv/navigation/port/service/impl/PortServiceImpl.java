package at.fhv.navigation.port.service.impl;

import at.fhv.navigation.dto.PortDTO;
import at.fhv.navigation.port.model.Port;
import at.fhv.navigation.port.repository.PortRepository;
import at.fhv.navigation.port.service.PortNotFoundException;
import at.fhv.navigation.port.service.PortService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PortServiceImpl implements PortService {

    private final PortRepository portRepository;

    public PortServiceImpl(PortRepository portRepository) {
        this.portRepository = portRepository;
    }

    @Override
    public List<PortDTO> findAll() {
        return portRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public PortDTO findById(String id) {
        Port port = portRepository.findById(id)
                .orElseThrow(() -> new PortNotFoundException("Port not found: " + id));
        return toDto(port);
    }

    private PortDTO toDto(Port p) {
        return new PortDTO(p.getId(), p.getName(), p.getX(), p.getY());
    }
}