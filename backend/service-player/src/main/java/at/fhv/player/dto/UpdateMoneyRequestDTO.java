package at.fhv.player.dto;

public class UpdateMoneyRequestDTO {
    private int delta;
    private boolean clampAtZero;

    public UpdateMoneyRequestDTO() {}

    public UpdateMoneyRequestDTO(int delta) {
        this.delta = delta;
    }

    public UpdateMoneyRequestDTO(int delta, boolean clampAtZero) {
        this.delta = delta;
        this.clampAtZero = clampAtZero;
    }

    public int getDelta() { return delta; }
    public void setDelta(int delta) { this.delta = delta; }

    public boolean isClampAtZero() { return clampAtZero; }
    public void setClampAtZero(boolean clampAtZero) { this.clampAtZero = clampAtZero; }
}