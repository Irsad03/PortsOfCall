package at.fhv.session.repository;

import at.fhv.session.model.NewsCategory;
import at.fhv.session.model.NewsItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NewsItemRepository extends JpaRepository<NewsItem, String> {

    List<NewsItem> findBySessionId(String sessionId, Pageable pageable);

    List<NewsItem> findBySessionIdAndCategoryIn(
            String sessionId, Collection<NewsCategory> categories, Pageable pageable);

    List<NewsItem> findBySessionIdAndTickGreaterThanEqual(
            String sessionId, int sinceTick, Pageable pageable);

    List<NewsItem> findBySessionIdAndCategoryInAndTickGreaterThanEqual(
            String sessionId, Collection<NewsCategory> categories, int sinceTick, Pageable pageable);

    void deleteBySessionId(String sessionId);
}
