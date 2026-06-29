package at.fhv.session.repository;

import at.fhv.session.model.GameSession;
import at.fhv.session.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, String> {
    Optional<GameSession> findByCode(String code);
    List<GameSession> findAllByStatus(SessionStatus status);
}
