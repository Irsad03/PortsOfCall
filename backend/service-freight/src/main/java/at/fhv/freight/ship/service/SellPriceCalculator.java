package at.fhv.freight.ship.service;

import at.fhv.freight.dto.ShipClass;
import at.fhv.freight.ship.model.PlayerShip;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;


@Component
public class SellPriceCalculator {

    private static final double RESALE_RATE_LOW_COST   = 0.55;
    private static final double RESALE_RATE_MEDIUM     = 0.60;
    private static final double RESALE_RATE_HIGH_TECH   = 0.65;

    private static final double HULL_FLOOR = 0.40;

    private static final double AGE_DEPRECIATION_PER_HOUR = 0.01;
    private static final double AGE_FLOOR = 0.80;

    private static final int MIN_SELL_PRICE = 1;

    private static final double USED_MARKET_DISCOUNT_PER_HP = 0.006;

    public int calculateSellPrice(PlayerShip ship) {
        long minutesOwned = ship.getPurchasedAt() != null
                ? Math.max(0, Duration.between(ship.getPurchasedAt(), LocalDateTime.now()).toMinutes())
                : 0;
        return calculateSellPrice(
                ship.getPrice(), ship.getShipClass(),
                ship.getHealthPoints(), ship.getMaxHealthPoints(),
                minutesOwned);
    }

    int calculateSellPrice(int originalPrice, ShipClass shipClass,
                           int healthPoints, int maxHealthPoints, long minutesOwned) {
        double hullRatio = maxHealthPoints > 0
                ? Math.max(0.0, Math.min(1.0, (double) healthPoints / maxHealthPoints))
                : 0.0;
        double hullFactor = HULL_FLOOR + (1.0 - HULL_FLOOR) * hullRatio;

        double hoursOwned = minutesOwned / 60.0;
        double ageFactor = Math.max(AGE_FLOOR, 1.0 - AGE_DEPRECIATION_PER_HOUR * hoursOwned);

        double value = originalPrice * resaleRate(shipClass) * hullFactor * ageFactor;
        return Math.max(MIN_SELL_PRICE, (int) Math.round(value));
    }

    public int usedMarketPrice(int originalPrice, int healthPoints) {
        int hpBelowFull = Math.max(0, 100 - healthPoints);
        double price = originalPrice * (1.0 - hpBelowFull * USED_MARKET_DISCOUNT_PER_HP);
        return Math.max(MIN_SELL_PRICE, (int) Math.round(price));
    }

    private double resaleRate(ShipClass shipClass) {
        if (shipClass == null) return RESALE_RATE_MEDIUM;
        return switch (shipClass) {
            case LOW_COST_SHIPS -> RESALE_RATE_LOW_COST;
            case MEDIUM_COST_SHIPS -> RESALE_RATE_MEDIUM;
            case HIGH_TECH_SHIPS -> RESALE_RATE_HIGH_TECH;
        };
    }
}