package at.fhv.session.controller;

import at.fhv.session.dto.CreateNewsRequestDTO;
import at.fhv.session.dto.NewsItemDTO;
import at.fhv.session.service.NewsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @PostMapping("/internal/sessions/{sessionId}/news")
    public ResponseEntity<NewsItemDTO> ingestNews(@PathVariable String sessionId,
                                                  @RequestBody CreateNewsRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(newsService.addNews(sessionId, request));
    }

    @GetMapping("/api/sessions/{sessionId}/news")
    public ResponseEntity<List<NewsItemDTO>> getNews(
            @PathVariable String sessionId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer sinceTick,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(newsService.getNews(sessionId, category, sinceTick, limit, offset));
    }
}
