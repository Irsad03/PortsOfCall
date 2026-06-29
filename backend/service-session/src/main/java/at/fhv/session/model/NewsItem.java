package at.fhv.session.model;

import jakarta.persistence.*;

@Entity
@Table(name = "news_items", indexes = {
        @Index(name = "idx_news_session_tick", columnList = "sessionId, tick")
})
public class NewsItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String sessionId;

    private int tick;

    @Column(nullable = false, length = 300)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsCategory category;

    @Column(length = 1000)
    private String relatedPortIds;

    @Column(nullable = false)
    private long createdAt = System.currentTimeMillis();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public int getTick() { return tick; }
    public void setTick(int tick) { this.tick = tick; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public NewsCategory getCategory() { return category; }
    public void setCategory(NewsCategory category) { this.category = category; }

    public String getRelatedPortIds() { return relatedPortIds; }
    public void setRelatedPortIds(String relatedPortIds) { this.relatedPortIds = relatedPortIds; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
