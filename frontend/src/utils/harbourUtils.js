export function filterShipsForPort(fleet, portId) {
    if (!Array.isArray(fleet) || !portId) return [];
    return fleet.filter(function(ship) { return ship.currentPortId === portId; });
}
