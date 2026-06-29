package at.fhv.engine.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ShipStatus {
    IDLE,
    LOADING,
    LOADED,
    UNLOADING,
    IN_TRANSIT,
    AWAITING_PILOT,
    CUSTOMS_HOLD,
    MINIGAME_WAITING,
    MINIGAME_ACTIVE,
    SEIZED;

    @JsonCreator
    public static ShipStatus fromJson(String value) {
        if (value == null) return null;
        try {
            return ShipStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}