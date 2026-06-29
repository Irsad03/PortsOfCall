package at.fhv.session.service;

import at.fhv.session.dto.CreateNewsRequestDTO;
import at.fhv.session.dto.NewsItemDTO;

import java.util.List;

public interface NewsService {
    NewsItemDTO addNews(String sessionId, CreateNewsRequestDTO request);
    List<NewsItemDTO> getNews(String sessionId, String categoryCsv, Integer sinceTick,
                              int limit, int offset);

    void deleteForSession(String sessionId);
}
