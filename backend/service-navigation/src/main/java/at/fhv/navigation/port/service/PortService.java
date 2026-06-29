package at.fhv.navigation.port.service;

import at.fhv.navigation.dto.PortDTO;

import java.util.List;

public interface PortService {
    List<PortDTO> findAll();
    PortDTO findById(String id);
}