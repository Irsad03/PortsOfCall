package at.fhv.freight.ship.config;

import at.fhv.freight.dto.SmugglingOfferDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

// Persists a single {@link SmugglingOfferDTO} as JSON on the PlayerShip row.
@Converter
public class SmugglingOfferConverter implements AttributeConverter<SmugglingOfferDTO, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(SmugglingOfferDTO offer) {
        if (offer == null) return null;
        try {
            return MAPPER.writeValueAsString(offer);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public SmugglingOfferDTO convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, SmugglingOfferDTO.class);
        } catch (Exception e) {
            return null;
        }
    }
}