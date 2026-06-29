package at.fhv.engine.dto;

public class UpdateMoneyRequestDTO {
    private int delta;

    public UpdateMoneyRequestDTO() {}

    public UpdateMoneyRequestDTO(int delta) {
        this.delta = delta;
    }

    public int getDelta() { return delta; }
    public void setDelta(int delta) { this.delta = delta; }
}