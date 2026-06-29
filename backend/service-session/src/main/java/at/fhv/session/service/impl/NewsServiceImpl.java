package at.fhv.session.service.impl;

import at.fhv.session.dto.CreateNewsRequestDTO;
import at.fhv.session.dto.NewsItemDTO;
import at.fhv.session.model.GameSession;
import at.fhv.session.model.NewsCategory;
import at.fhv.session.model.NewsItem;
import at.fhv.session.repository.GameSessionRepository;
import at.fhv.session.repository.NewsItemRepository;
import at.fhv.session.repository.OffsetPageRequest;
import at.fhv.session.service.NewsService;
import at.fhv.session.service.SessionNotFoundException;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@Service
public class NewsServiceImpl implements NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsServiceImpl.class);
    private static final int DEFAULT_LIMIT = 25;
    private static final int MAX_LIMIT = 100;
    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Order.desc("tick"), Sort.Order.desc("createdAt"));

    private final NewsItemRepository newsRepository;
    private final GameSessionRepository sessionRepository;

    public NewsServiceImpl(NewsItemRepository newsRepository,
                           GameSessionRepository sessionRepository) {
        this.newsRepository = newsRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    @Transactional
    public NewsItemDTO addNews(String sessionId, CreateNewsRequestDTO request) {
        if (request.getHeadline() == null || request.getHeadline().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "headline is required");
        }
        NewsCategory category = parseCategory(request.getCategory());

        GameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        NewsItem item = new NewsItem();
        item.setSessionId(sessionId);
        item.setTick(request.getTick() != null ? request.getTick() : session.getCurrentTick());
        item.setHeadline(truncate(request.getHeadline(), 300));
        item.setBody(request.getBody());
        item.setCategory(category);
        item.setRelatedPortIds(joinPortIds(request.getRelatedPortIds()));

        NewsItem saved = newsRepository.save(item);
        log.info("News [{}] added to session {} (tick {}): {}",
                category, sessionId, saved.getTick(), saved.getHeadline());
        return toDto(saved);
    }

    @Override
    public List<NewsItemDTO> getNews(String sessionId, String categoryCsv, Integer sinceTick,
                                     int limit, int offset) {
        int safeLimit = limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        Pageable page = new OffsetPageRequest(Math.max(0, offset), safeLimit, NEWEST_FIRST);
        List<NewsCategory> categories = parseCategoryCsv(categoryCsv);

        List<NewsItem> items;
        if (categories != null && sinceTick != null) {
            items = newsRepository.findBySessionIdAndCategoryInAndTickGreaterThanEqual(
                    sessionId, categories, sinceTick, page);
        } else if (categories != null) {
            items = newsRepository.findBySessionIdAndCategoryIn(sessionId, categories, page);
        } else if (sinceTick != null) {
            items = newsRepository.findBySessionIdAndTickGreaterThanEqual(sessionId, sinceTick, page);
        } else {
            items = newsRepository.findBySessionId(sessionId, page);
        }
        return items.stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public void deleteForSession(String sessionId) {
        newsRepository.deleteBySessionId(sessionId);
    }

    // Helpers

    private NewsCategory parseCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "category is required");
        }
        try {
            return NewsCategory.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unknown news category: " + raw);
        }
    }

    private List<NewsCategory> parseCategoryCsv(String csv) {
        if (csv == null || csv.isBlank()) return null;
        List<NewsCategory> parsed = Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try { return NewsCategory.valueOf(s.toUpperCase()); }
                    catch (IllegalArgumentException ex) { return null; }
                })
                .filter(c -> c != null)
                .distinct()
                .toList();
        return parsed.isEmpty() ? null : parsed;
    }

    private String joinPortIds(List<String> portIds) {
        if (portIds == null || portIds.isEmpty()) return null;
        String joined = String.join(",", portIds.stream().filter(p -> p != null && !p.isBlank()).toList());
        return joined.isEmpty() ? null : truncate(joined, 1000);
    }

    private List<String> splitPortIds(String joined) {
        if (joined == null || joined.isBlank()) return List.of();
        return Arrays.stream(joined.split(",")).filter(s -> !s.isBlank()).toList();
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }

    private NewsItemDTO toDto(NewsItem item) {
        return new NewsItemDTO(
                item.getId(),
                item.getSessionId(),
                item.getTick(),
                item.getHeadline(),
                item.getBody(),
                item.getCategory().name(),
                splitPortIds(item.getRelatedPortIds()),
                item.getCreatedAt()
        );
    }
}
