package at.fhv.freight.ship.service;

import at.fhv.freight.dto.ShipClass;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;


@Component
public class ShipClassConfig {

    private final double defaultSpeed;
    private final Map<ShipClass, Double> speedPerClass = new EnumMap<>(ShipClass.class);
    private final int defaultFuelPer100;
    private final Map<ShipClass, Integer> fuelPer100PerClass = new EnumMap<>(ShipClass.class);

    public ShipClassConfig(
            // speed (distance units per tick)
            @Value("${ship.speed.default:42}") double defaultSpeed,
            @Value("${ship.speed.low-cost:0}") double speedLowCost,
            @Value("${ship.speed.medium-cost:0}") double speedMediumCost,
            @Value("${ship.speed.high-tech:0}") double speedHighTech,
            // Fuel (units burned per 100 distance units)
            @Value("${ship.fuel.low-cost:20}") int fuelLowCost,
            @Value("${ship.fuel.medium-cost:12}") int fuelMediumCost,
            @Value("${ship.fuel.high-tech:7}") int fuelHighTech) {
        this.defaultSpeed = defaultSpeed > 0 ? defaultSpeed : 42;
        if (speedLowCost > 0)    speedPerClass.put(ShipClass.LOW_COST_SHIPS, speedLowCost);
        if (speedMediumCost > 0) speedPerClass.put(ShipClass.MEDIUM_COST_SHIPS, speedMediumCost);
        if (speedHighTech > 0)   speedPerClass.put(ShipClass.HIGH_TECH_SHIPS, speedHighTech);

        this.defaultFuelPer100 = Math.max(1, fuelMediumCost);
        fuelPer100PerClass.put(ShipClass.LOW_COST_SHIPS, Math.max(1, fuelLowCost));
        fuelPer100PerClass.put(ShipClass.MEDIUM_COST_SHIPS, Math.max(1, fuelMediumCost));
        fuelPer100PerClass.put(ShipClass.HIGH_TECH_SHIPS, Math.max(1, fuelHighTech));
    }

    public double baseSpeedPerTick(ShipClass shipClass) {
        if (shipClass != null) {
            Double override = speedPerClass.get(shipClass);
            if (override != null) return override;
        }
        return defaultSpeed;
    }

    public int fuelPer100(ShipClass shipClass) {
        if (shipClass != null) {
            Integer perClass = fuelPer100PerClass.get(shipClass);
            if (perClass != null) return perClass;
        }
        return defaultFuelPer100;
    }
}
