package at.fhv.freight.ship.config;

import at.fhv.freight.ship.model.Waypoint;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Converter
public class WaypointListConverter implements AttributeConverter<List<Waypoint>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Waypoint> waypoints) {
        if (waypoints == null) return "[]";
        try {
            return MAPPER.writeValueAsString(waypoints);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public List<Waypoint> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            Waypoint[] array = MAPPER.readValue(json, Waypoint[].class);
            return Arrays.asList(array);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
