package at.fhv.engine.dto;

import java.util.List;

// Mirror of session-service's CreateNewsRequestDTO (same JSON shape over the
// wire) Sent to POST /internal/sessions/{sessionId}/news.
public class CreateNewsRequestDTO {

    private Integer tick;
    private String headline;
    private String body;
    private String category;
    private List<String> relatedPortIds;

    public CreateNewsRequestDTO() {}

    public CreateNewsRequestDTO(Integer tick, String headline, String body,
                                String category, List<String> relatedPortIds) {
        this.tick = tick;
        this.headline = headline;
        this.body = body;
        this.category = category;
        this.relatedPortIds = relatedPortIds;
    }

    public Integer getTick() { return tick; }
    public void setTick(Integer tick) { this.tick = tick; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getRelatedPortIds() { return relatedPortIds; }
    public void setRelatedPortIds(List<String> relatedPortIds) { this.relatedPortIds = relatedPortIds; }
}