package at.fhv.player.service.impl;

import at.fhv.player.dto.CreatePlayerRequestDTO;
import at.fhv.player.dto.LeaderboardEntryDTO;
import at.fhv.player.dto.PlayerDTO;
import at.fhv.player.exception.InsufficientFundsException;
import at.fhv.player.client.PortClient;
import at.fhv.player.model.Loan;
import at.fhv.player.model.LoanStatus;
import at.fhv.player.model.Mortgage;
import at.fhv.player.model.MortgageStatus;
import at.fhv.player.model.Player;
import at.fhv.player.repository.LoanRepository;
import at.fhv.player.repository.MortgageRepository;
import at.fhv.player.repository.PlayerRepository;
import at.fhv.player.service.PlayerNotFoundException;
import at.fhv.player.service.PlayerService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PlayerServiceImpl implements PlayerService {

    private static final int DEFAULT_STARTING_MONEY = 40000;

    // Debt that still weighs on the player's net worth. Loans: a defaulted loan
    // is still owed (see LoanServiceImpl), so DEFAULTED counts. Mortgages: SEIZED
    // is already written off to a 0 balance, so only ACTIVE/OVERDUE matter.
    private static final List<LoanStatus> LOAN_DEBT_STATUSES =
            List.of(LoanStatus.ACTIVE, LoanStatus.OVERDUE, LoanStatus.DEFAULTED);
    private static final List<MortgageStatus> MORTGAGE_DEBT_STATUSES =
            List.of(MortgageStatus.ACTIVE, MortgageStatus.OVERDUE);

    private final PlayerRepository playerRepository;
    private final PortClient portClient;
    private final LoanRepository loanRepository;
    private final MortgageRepository mortgageRepository;

    public PlayerServiceImpl(PlayerRepository playerRepository, PortClient portClient,
                             LoanRepository loanRepository, MortgageRepository mortgageRepository) {
        this.playerRepository = playerRepository;
        this.portClient = portClient;
        this.loanRepository = loanRepository;
        this.mortgageRepository = mortgageRepository;
    }

    @Override
    @Transactional
    public PlayerDTO createPlayer(CreatePlayerRequestDTO request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        int money = request.getStartingMoney() != null ? request.getStartingMoney() : DEFAULT_STARTING_MONEY;
        Player player = new Player(request.getName(), request.getSessionId(), money);
        return toDto(playerRepository.save(player));
    }

    @Override
    public PlayerDTO findById(String id) {
        return toDto(requirePlayer(id));
    }

    @Override
    public List<PlayerDTO> findBySession(String sessionId) {
        List<Player> players = playerRepository.findAllBySessionId(sessionId);
        Map<String, Integer> debt = debtByPlayer(players.stream().map(Player::getId).toList());
        return players.stream()
                .map(p -> toDto(p, debt.getOrDefault(p.getId(), 0)))
                .toList();
    }

    @Override
    public List<LeaderboardEntryDTO> getLeaderboard(String sessionId) {
        // Rank by NET WORTH (cash − outstanding debt), not raw cash, so borrowed
        // money can't inflate a player's standing. Ship value is intentionally not
        // counted — only the money the player actually holds, minus what they owe.
        List<Player> players = playerRepository.findAllBySessionId(sessionId);
        Map<String, Integer> debt = debtByPlayer(players.stream().map(Player::getId).toList());
        return players.stream()
                .map(p -> new LeaderboardEntryDTO(
                        p.getId(), p.getName(), p.getMoney() - debt.getOrDefault(p.getId(), 0)))
                .sorted(Comparator.comparingInt(LeaderboardEntryDTO::getMoney).reversed())
                .toList();
    }

    @Override
    @Transactional
    public PlayerDTO updateMoney(String id, int delta) {
        return updateMoney(id, delta, false);
    }

    @Override
    @Transactional
    public PlayerDTO updateMoney(String id, int delta, boolean clampAtZero) {
        Player player = requirePlayer(id);
        int newBalance = player.getMoney() + delta;
        if (newBalance < 0) {
            if (clampAtZero) {
                newBalance = 0;
            } else {
                throw new InsufficientFundsException("this action", -delta, player.getMoney());
            }
        }
        player.setMoney(newBalance);
        return toDto(playerRepository.save(player));
    }

    @Override
    @Transactional
    public PlayerDTO updatePosition(String id, int x, int y) {
        Player player = requirePlayer(id);
        player.setPositionX(x);
        player.setPositionY(y);
        return toDto(playerRepository.save(player));
    }

    @Override
    @Transactional
    public PlayerDTO selectHomePort(String id, String portId) {
        Player player = requirePlayer(id);
        if (player.getHomePortId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Home port is already set");
        }
        if (!portClient.exists(portId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Port not found: " + portId);
        }
        player.setHomePortId(portId);
        player.setCurrentPortId(portId);
        return toDto(playerRepository.save(player));
    }

    @Override
    @Transactional
    public PlayerDTO updateCurrentPort(String id, String portId) {
        Player player = requirePlayer(id);
        player.setCurrentPortId(portId);
        return toDto(playerRepository.save(player));
    }

    @Override
    @Transactional
    public PlayerDTO updateCurrentShip(String id, String shipId) {
        Player player = requirePlayer(id);
        player.setCurrentShipId((shipId != null && shipId.isBlank()) ? null : shipId);
        return toDto(playerRepository.save(player));
    }

    @Override
    @Transactional
    public PlayerDTO updateSession(String id, String sessionId) {
        Player player = requirePlayer(id);
        player.setSessionId((sessionId != null && sessionId.isBlank()) ? null : sessionId);
        return toDto(playerRepository.save(player));
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private Player requirePlayer(String id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new PlayerNotFoundException("Player not found: " + id));
    }

    /** Outstanding debt (loans + mortgages still owed) for a single player. */
    private int debtFor(String playerId) {
        return debtByPlayer(List.of(playerId)).getOrDefault(playerId, 0);
    }

    /** Outstanding debt per player, summed in two batch queries (loans + mortgages). */
    private Map<String, Integer> debtByPlayer(Collection<String> playerIds) {
        if (playerIds.isEmpty()) return Map.of();
        Map<String, Integer> byPlayer = loanRepository
                .findByPlayerIdInAndStatusIn(playerIds, LOAN_DEBT_STATUSES).stream()
                .collect(Collectors.groupingBy(Loan::getPlayerId,
                        Collectors.summingInt(Loan::getRemainingBalance)));
        for (Mortgage m : mortgageRepository.findByPlayerIdInAndStatusIn(playerIds, MORTGAGE_DEBT_STATUSES)) {
            byPlayer.merge(m.getPlayerId(), m.getRemainingBalance(), Integer::sum);
        }
        return byPlayer;
    }

    private PlayerDTO toDto(Player p) {
        return toDto(p, debtFor(p.getId()));
    }

    private PlayerDTO toDto(Player p, int debt) {
        PlayerDTO dto = new PlayerDTO(
                p.getId(), p.getName(), p.getMoney(), p.getSessionId(),
                p.getPositionX(), p.getPositionY(),
                p.getHomePortId(), p.getCurrentPortId(), p.getCurrentShipId()
        );
        dto.setNetWorth(p.getMoney() - debt);
        return dto;
    }
}
