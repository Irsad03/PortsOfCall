export const ShipStatus = Object.freeze({
    IDLE:           'IDLE',
    LOADING:        'LOADING',
    LOADED:         'LOADED',
    IN_TRANSIT:     'IN_TRANSIT',
    AWAITING_PILOT: 'AWAITING_PILOT',
    CUSTOMS_HOLD:   'CUSTOMS_HOLD',
    MINIGAME_WAITING: 'MINIGAME_WAITING',
    MINIGAME_ACTIVE: 'MINIGAME_ACTIVE',
    SEIZED:         'SEIZED',
});

export function isDocked(status) {
    return status === ShipStatus.IDLE || status === ShipStatus.LOADING || status === ShipStatus.LOADED;
}

export function isAtSea(status) {
    return status === ShipStatus.IN_TRANSIT || status === ShipStatus.AWAITING_PILOT || status === ShipStatus.MINIGAME_WAITING || status === ShipStatus.MINIGAME_ACTIVE;
}

export function isCustomsHold(status) {
    return status === ShipStatus.CUSTOMS_HOLD;
}

export function isSeized(status) {
    return status === ShipStatus.SEIZED;
}
