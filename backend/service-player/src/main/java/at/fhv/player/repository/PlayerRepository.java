package at.fhv.player.repository;

import at.fhv.player.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, String> {
    List<Player> findAllBySessionId(String sessionId);
}
