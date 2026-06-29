package at.fhv.session.dto;

import java.util.List;

public class NewsItemDTO {

    private String id;
    private String sessionId;
    private int tick;
    private String headline;
    private String body;
    private String category;
    private List<String> relatedPortIds;
    private long createdAt;

    public NewsItemDTO() {}

    public NewsItemDTO(String id, String sessionId, int tick, String headline, String body,
                       String category, List<String> relatedPortIds, long createdAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.tick = tick;
        this.headline = headline;
        this.body = body;
        this.category = category;
        this.relatedPortIds = relatedPortIds;
        this.createdAt = createdAt;
    }

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

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getRelatedPortIds() { return relatedPortIds; }
    public void setRelatedPortIds(List<String> relatedPortIds) { this.relatedPortIds = relatedPortIds; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
