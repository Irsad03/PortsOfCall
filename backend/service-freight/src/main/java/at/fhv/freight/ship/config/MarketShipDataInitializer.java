package at.fhv.freight.ship.config;

import at.fhv.freight.dto.ShipClass;
import at.fhv.freight.ship.model.MarketShip;
import at.fhv.freight.ship.repository.MarketShipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Configuration
public class MarketShipDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(MarketShipDataInitializer.class);

    @Bean
    @Transactional
    CommandLineRunner seedMarketShips(MarketShipRepository repo) {
        return args -> {
            if (repo.count() > 0) {
                log.info("Market ships already seeded – skipping initialization.");
                return;
            }

            SecureRandom rng = new SecureRandom();

            repo.save(new MarketShip("Rusty Sloop", ShipClass.LOW_COST_SHIPS, 10000,
                    "Old, but it floats.", 50, 100, 3, false));
            repo.save(new MarketShip("Coastal Runner", ShipClass.LOW_COST_SHIPS, 8500,
                    "Small and cheap – but a touch thirstier at the pump.", 40, 100, 4, false));
            repo.save(new MarketShip("Steady Trader", ShipClass.MEDIUM_COST_SHIPS, 25000,
                    "Solid value for the price.", 150, 100, 5, false));
            repo.save(new MarketShip("Stormrider Clipper", ShipClass.MEDIUM_COST_SHIPS, 26000,
                    "Generous cargo hold paired with efficient engines.", 200, 100, 4, false));
            repo.save(new MarketShip("Ocean Titan", ShipClass.HIGH_TECH_SHIPS, 80000,
                    "Maximum volume – but the price tag matches.", 500, 100, 7, false));
            repo.save(new MarketShip("Crown Galleon", ShipClass.HIGH_TECH_SHIPS, 95000,
                    "Largest hold and efficient engines – the flagship of the fleet.", 600, 100, 6, false));

            int hp1 = 50 + rng.nextInt(21);
            int price1 = (int) Math.round(10000 * (1.0 - (100 - hp1) * 0.006));
            repo.save(new MarketShip("Weathered Sloop", ShipClass.LOW_COST_SHIPS, price1,
                    "Pre-owned and cheap. Showing its age (" + hp1 + " HP).",
                    50, hp1, 3, true));

            int hp2 = 50 + rng.nextInt(21);
            int price2 = (int) Math.round(25000 * (1.0 - (100 - hp2) * 0.006));
            repo.save(new MarketShip("Battered Trader", ShipClass.MEDIUM_COST_SHIPS, price2,
                    "Lightly used, still solid (" + hp2 + " HP).",
                    150, hp2, 5, true));

            int hp3 = 50 + rng.nextInt(21);
            int price3 = (int) Math.round(80000 * (1.0 - (100 - hp3) * 0.006));
            repo.save(new MarketShip("Battle-Worn Titan", ShipClass.HIGH_TECH_SHIPS, price3,
                    "Seen plenty of storms, still seaworthy (" + hp3 + " HP).",
                    500, hp3, 7, true));

            int hp4 = 50 + rng.nextInt(21);
            int price4 = (int) Math.round(8500 * (1.0 - (100 - hp4) * 0.006));
            repo.save(new MarketShip("Salt-Stained Runner", ShipClass.LOW_COST_SHIPS, price4,
                    "Small previous owner – easy on the wallet, hard on fuel (" + hp4 + " HP).",
                    40, hp4, 4, true));

            int hp5 = 50 + rng.nextInt(21);
            int price5 = (int) Math.round(26000 * (1.0 - (100 - hp5) * 0.006));
            repo.save(new MarketShip("Storm-Worn Clipper", ShipClass.MEDIUM_COST_SHIPS, price5,
                    "Big hold, efficient engines – with a bit of patina (" + hp5 + " HP).",
                    200, hp5, 4, true));

            int hp6 = 50 + rng.nextInt(21);
            int price6 = (int) Math.round(95000 * (1.0 - (100 - hp6) * 0.006));
            repo.save(new MarketShip("Tarnished Galleon", ShipClass.HIGH_TECH_SHIPS, price6,
                    "Former flagship – size and efficiency, just with chipped paint (" + hp6 + " HP).",
                    600, hp6, 6, true));

            log.info("Seeded {} market ships (6 new + 6 used).", repo.count());
        };
    }
}
