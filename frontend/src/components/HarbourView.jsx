import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';
import { isAtSea, isCustomsHold, isSeized, ShipStatus } from '../constants/ShipStatus';
import { useToast } from '../context/ToastContext';

const FUEL_PRICE_PER_UNIT = 10;
const REPAIR_COST_PER_HP  = 125;

function StatusBar({ value, colorFn }) {
    const color = colorFn(value);
    return (
        <div style={{ background: '#1e1e1e', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
                width: `${Math.max(0, Math.min(100, value))}%`,
                height: '100%',
                background: color,
                transition: 'width 0.4s ease',
            }} />
        </div>
    );
}

function fuelColor(v) { return v > 30 ? '#4caf50' : v > 10 ? '#ff9800' : '#f44336'; }
function hullColor(v) { return v >= 60 ? '#4caf50' : v >= 20 ? '#ff9800' : '#f44336'; }

function reserveTankPercent(ship) {
    const cap = ship.reserveFuelCapacity ?? 0;
    if (cap <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((ship.reserveFuel ?? 0) / cap * 100)));
}

const shipClassLabel = (cls) => ({
    LOW_COST_SHIPS:    'Low-Cost',
    MEDIUM_COST_SHIPS: 'Medium',
    HIGH_TECH_SHIPS:   'High-Tech',
}[cls] ?? cls ?? '—');

export default function HarbourView({ portId, portName, playerId, sessionId, ports = [], onShipUnloaded, onPreviewRoute, onContractClick }) {
    const { currentTick, refreshMyBalance, updatePlayerState, setSmugglingOffer, isRouteBlocked, hasAlternativeRoute } = useGame();
    const { pushToast } = useToast();

    const [ships,         setShips]         = useState([]);
    const [contractsByPort, setContractsByPort] = useState({});
    const [shipCargo,     setShipCargo]     = useState({});
    const [actionLoading, setActionLoading] = useState({});
    const [actionError,   setActionError]   = useState(null);
    const [forfeitConfirm, setForfeitConfirm] = useState(null);
    const [sailDest,       setSailDest]     = useState({});

    const loadData = useCallback(async () => {
        if (!playerId) return;
        try {
            const fleetData = await gameService.getFleet(playerId);
            const fleetShips = Array.isArray(fleetData) ? [...fleetData] : [];
            fleetShips.sort((a, b) => {
                const aHere = a.currentPortId === portId ? 0 : 1;
                const bHere = b.currentPortId === portId ? 0 : 1;
                return aHere - bHere;
            });
            setShips(fleetShips);

            const distinctPorts = [...new Set(fleetShips.map(s => s.currentPortId).filter(Boolean))];
            const contractEntries = await Promise.all(
                distinctPorts.map(async pid => {
                    try {
                        const c = sessionId ? await gameService.getCargo(pid, sessionId, currentTick) : [];
                        return [pid, c ?? []];
                    } catch {
                        return [pid, []];
                    }
                }),
            );
            setContractsByPort(Object.fromEntries(contractEntries));

            const dockedShips = fleetShips.filter(s => !isAtSea(s.status));
            const cargoEntries = await Promise.all(
                dockedShips.map(async s => {
                    try {
                        const cargo = await gameService.getContractsForShip(s.id, 'ACCEPTED');
                        return [s.id, cargo ?? []];
                    } catch {
                        return [s.id, []];
                    }
                }),
            );
            setShipCargo(Object.fromEntries(cargoEntries));
        } catch (err) {
            console.error('HarbourView load error:', err);
        }
    }, [portId, playerId, sessionId, currentTick]);

    useEffect(() => { loadData(); }, [loadData, currentTick]);

    async function handleRefuel(ship) {
        setActionLoading(prev => ({ ...prev, [ship.id]: true }));
        setActionError(null);
        try {
            await gameService.refuelShip(playerId, ship.id);
            await refreshMyBalance(playerId);
            await loadData();
        } catch (err) {
            setActionError(err.message || 'Refuel failed');
        } finally {
            setActionLoading(prev => ({ ...prev, [ship.id]: false }));
        }
    }

    async function handleRepair(ship) {
        setActionLoading(prev => ({ ...prev, [ship.id]: true }));
        setActionError(null);
        try {
            await gameService.repairShip(playerId, ship.id);
            await refreshMyBalance(playerId);
            await loadData();
        } catch (err) {
            setActionError(err.message || 'Repair failed');
        } finally {
            setActionLoading(prev => ({ ...prev, [ship.id]: false }));
        }
    }

    const [unloadResult, setUnloadResult] = useState(null);

    async function handleUnload(ship) {
        setActionLoading(prev => ({ ...prev, [ship.id]: true }));
        setActionError(null);
        try {
            const result = await gameService.unloadCargo(playerId, ship.id, currentTick);
            setUnloadResult(result);
            onShipUnloaded?.(ship.id);
            if (result?.ratsLoss > 0) {
                const n = result.contractsHitByRats ?? 0;
                pushToast({
                    type: 'warning',
                    title: 'Rats ate your cargo!',
                    message: `${n} cargo${n === 1 ? '' : 's'} damaged on the way — lost value: −${result.ratsLoss.toLocaleString()}🪙.`,
                    ttl: 8000,
                });
            }
            await refreshMyBalance(playerId);
            await loadData();
        } catch (err) {
            setActionError(err.message || 'Unload failed');
        } finally {
            setActionLoading(prev => ({ ...prev, [ship.id]: false }));
        }
    }

    async function handleSail(ship, destinationOverride) {
        const destinationPortId = destinationOverride || sailDest[ship.id];
        if (!destinationPortId) {
            setActionError('Pick a destination port first.');
            return;
        }
        setActionLoading(prev => ({ ...prev, [ship.id]: true }));
        setActionError(null);
        try {
            const response = await gameService.startRoute({
                playerId,
                shipId: ship.id,
                destinationPortId,
            });
            onPreviewRoute?.(null, null);
            if (response?.pendingSmugglingOffer) {
                setSmugglingOffer?.({
                    offer:               response.pendingSmugglingOffer,
                    shipId:              ship.id,
                    playerId,
                    destinationPortName: response.destinationPortName
                        ?? ports.find(p => p.id === destinationPortId)?.name
                        ?? destinationPortId,
                });
                return;
            }
            updatePlayerState?.(playerId, { shipStatus: ShipStatus.IN_TRANSIT });
            setSailDest(prev => ({ ...prev, [ship.id]: '' }));
            await loadData();
        } catch (err) {
            setActionError(err.message || 'Could not set sail.');
        } finally {
            setActionLoading(prev => ({ ...prev, [ship.id]: false }));
        }
    }

    async function handleForfeitConfirmed() {
        if (!forfeitConfirm) return;
        const { shipId, contract } = forfeitConfirm;
        setActionLoading(prev => ({ ...prev, [shipId]: true }));
        setActionError(null);
        try {
            await gameService.forfeitContract(playerId, shipId, contract.id);
            setForfeitConfirm(null);
            await refreshMyBalance(playerId);
            await loadData();
        } catch (err) {
            setActionError(err.message || 'Forfeit failed');
        } finally {
            setActionLoading(prev => ({ ...prev, [shipId]: false }));
        }
    }

    const portNameOf = (pid) => ports.find(p => p.id === pid)?.name ?? portName ?? 'Port';

    const renderPortHeader = (pid) => (
        <div className="card-header" style={{ marginBottom: '4px' }}>
            <h3 style={{ margin: 0 }}>⚓ {portNameOf(pid)}</h3>
        </div>
    );

    const acceptableContractsFor = (ship) => {
        const list = contractsByPort[ship.currentPortId] ?? [];
        if (list.length === 0) return [];
        const ready = !isAtSea(ship.status)
            && !isSeized(ship.status)
            && !isCustomsHold(ship.status)
            && (ship.customsStatus ?? 'NONE') === 'NONE';
        if (!ready) return [];
        const accepted     = shipCargo[ship.id] ?? [];
        const usedCapacity = accepted.reduce((sum, a) => sum + (a.requiredCapacity ?? 0), 0);
        const remaining    = (ship.capacity ?? 0) - usedCapacity;
        const hasLegal     = accepted.some(a => !a.illegal);
        const hasIllegal   = accepted.some(a => a.illegal);
        return list.filter(c => {
            if ((c.requiredCapacity ?? 0) > remaining) return false;
            return c.illegal ? !hasIllegal : !hasLegal;
        });
    };

    const renderContracts = (ship) => {
        const list = acceptableContractsFor(ship);
        if (list.length === 0) return null;
        return (
            <div style={{ borderTop: '1px solid #333', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{
                    fontSize:      '11px',
                    color:         'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom:  '8px',
                }}>
                    📦 Available Contracts ({list.length})
                </div>
                <div className="grid-list">
                    {list.slice(0, 3).map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => onContractClick?.(c.id, ship.id)}
                            className="list-item"
                            style={{
                                padding:    '8px 10px',
                                overflow:   'hidden',
                                width:      '100%',
                                textAlign:  'left',
                                cursor:     onContractClick ? 'pointer' : 'default',
                                font:       'inherit',
                                color:      'inherit',
                            }}
                            title="Open in Cargo Market"
                        >
                            <div className="list-item-content" style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    → {c.destinationPortName || c.destinationPortId || '—'}
                                </strong>
                                <small>{c.requiredCapacity ?? '—'}t · Risk: {c.riskLevel || 'Low'}</small>
                            </div>
                            <div className="price-tag positive" style={{ fontSize: '12px', flexShrink: 0 }}>
                                {c.reward?.toLocaleString() ?? 0}🪙
                            </div>
                        </button>
                    ))}
                    {list.length > 3 && (
                        <button
                            type="button"
                            onClick={() => onContractClick?.(null, ship.id)}
                            style={{
                                fontSize:    '11px',
                                color:       'var(--text-muted)',
                                textAlign:   'center',
                                padding:     '4px',
                                background:  'transparent',
                                border:      'none',
                                cursor:      onContractClick ? 'pointer' : 'default',
                                width:       '100%',
                            }}
                        >
                            +{list.length - 3} more in Cargo Market
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {actionError && (
                <p className="text-danger" style={{ marginBottom: '10px', fontSize: '13px' }}>
                    {actionError}
                </p>
            )}

            {unloadResult && (
                <div className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>📦 Cargo Unloaded!</h4>
                    {unloadResult.contractsDelivered > 0 && (
                        <p style={{ margin: '4px 0' }}>
                            On time: <strong>{unloadResult.contractsDelivered}</strong>
                        </p>
                    )}
                    {unloadResult.contractsFailed > 0 && (
                        <>
                            <p style={{ margin: '4px 0', color: '#ffb74d' }}>
                                Late deliveries: <strong>{unloadResult.contractsFailed}</strong>
                                {' '}({unloadResult.maxLateTicks} day{unloadResult.maxLateTicks === 1 ? '' : 's'} late)
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                                Deduction: −{unloadResult.totalDeduction.toLocaleString()}🪙{' '}
                                ({unloadResult.maxLateTicks} × 80🪙 per day, capped at the wage)
                            </p>
                        </>
                    )}
                    {unloadResult.ratsLoss > 0 && (
                        <>
                            <p style={{ margin: '4px 0', color: '#ffb74d' }}>
                                Rats damage: <strong>{unloadResult.contractsHitByRats}</strong>
                                {' '}cargo{unloadResult.contractsHitByRats === 1 ? '' : 's'} affected
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                                Lost value: −{unloadResult.ratsLoss.toLocaleString()}🪙
                            </p>
                        </>
                    )}
                    <p style={{ margin: '4px 0' }}>
                        Net payout: <strong style={{ color: unloadResult.totalReward > 0 ? '#4caf50' : '#888' }}>
                        {unloadResult.totalReward.toLocaleString()}🪙
                    </strong>
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ marginTop: '8px', fontSize: '11px' }}
                        onClick={() => setUnloadResult(null)}
                    >
                        Close
                    </button>
                </div>
            )}

            {forfeitConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '420px' }}>
                        <div className="modal-icon">⚠️</div>
                        <h2>Forfeit cargo?</h2>
                        <p style={{ margin: '12px 0 8px' }}>
                            <strong>{forfeitConfirm.contract.description ?? 'Cargo contract'}</strong>
                        </p>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Drop this cargo back at port. You pay a <strong>50 %</strong> penalty
                            on the original wage — deducted from your balance immediately.
                        </p>
                        <div className="voyage-report">
                            <h4>Penalty</h4>
                            <p style={{ color: '#c0392b' }}>
                                − {forfeitConfirm.penalty.toLocaleString()}🪙
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '10px' }}
                                onClick={() => setForfeitConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{ flex: 1, padding: '10px' }}
                                onClick={handleForfeitConfirmed}
                            >
                                Forfeit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '16px' }}>
                {ships.length === 0 ? (
                    <div className="card">
                        {renderPortHeader(portId)}
                        <div style={{
                            background:   '#2a1f00',
                            border:       '1px solid #7f5a00',
                            borderRadius: '8px',
                            padding:      '12px 14px',
                            color:        '#ffcc80',
                            fontSize:     '13px',
                        }}>
                            ⚠ You don't own any ships yet — visit the <strong>Ship Broker</strong> to buy one.
                        </div>
                    </div>
                ) : (
                    <div className="grid-list">
                        {ships.map(ship => {
                            const fuel       = ship.fuelLevel    ?? 0;
                            const hp = ship.healthPoints ?? 100;
                            const maxHp = ship.maxHealthPoints ?? 100;
                            const refuelCost = Math.max(0, 100 - fuel) * FUEL_PRICE_PER_UNIT;
                            const repairCost = Math.max(0, maxHp - hp) * REPAIR_COST_PER_HP;
                            const hpPercentage = ship.healthPercentage ?? 100;
                            const shipAtSea  = isAtSea(ship.status);
                            const seized     = isSeized(ship.status);
                            const onReserve  = !!ship.usingAlternativeRoute && (ship.reserveFuelCapacity ?? 0) > 0;
                            const reservePct = onReserve ? reserveTankPercent(ship) : 0;
                            const canRefuel  = !seized && (ship.canRefuel ?? false);
                            const canRepair  = !seized && (ship.canRepair ?? false);
                            const tankFull   = refuelCost <= 0;
                            const hullFull   = repairCost <= 0;
                            const customsActive = (ship.customsStatus ?? 'NONE') !== 'NONE';
                            const canUnload  = !seized && !shipAtSea && !customsActive && (ship.hasCargoToUnload === true);
                            const isCritical = hp < 20;
                            const isLoading  = actionLoading[ship.id] ?? false;
                            const destName   = ports.find(p => p.id === ship.destinationPortId)?.name
                                ?? ship.destinationPortId
                                ?? '—';
                            const onHold     = isCustomsHold(ship.status);
                            const canSetSail = !seized && !shipAtSea && !onHold && !isCritical
                                && ship.status !== ShipStatus.LOADING;
                            const shipOrigin = ship.currentPortId ?? portId;
                            const cargoDest  = (shipCargo[ship.id] ?? [])
                                .find(c => c.destinationPortId && c.destinationPortId !== shipOrigin)
                                ?.destinationPortId;
                            const destDraft  = sailDest[ship.id] ?? cargoDest ?? '';
                            const otherPorts = ports.filter(p => p.id !== shipOrigin);

                            return (
                                <div
                                    key={ship.id}
                                    className="card"
                                    style={{
                                        display:       'flex',
                                        flexDirection: 'column',
                                        alignItems:    'stretch',
                                        gap:           '10px',
                                        overflow:      'hidden',
                                        marginBottom:  0,
                                        opacity: shipAtSea ? 0.85 : 1,
                                    }}
                                >
                                    {renderPortHeader(ship.currentPortId)}

                                    <div style={{
                                        display:    'flex',
                                        alignItems: 'flex-start',
                                        gap:        '8px',
                                        overflow:   'hidden',
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight:   700,
                                                fontSize:     '13px',
                                                color:        'var(--text-primary)',
                                                overflow:     'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace:   'nowrap',
                                            }}>
                                                🚢 {ship.name}
                                            </div>
                                            <div style={{
                                                fontSize:     '11px',
                                                color:        'var(--text-muted)',
                                                marginTop:    '2px',
                                                overflow:     'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace:   'nowrap',
                                            }}>
                                                {shipClassLabel(ship.shipClass)}
                                                {ship.capacity ? ` · ${ship.capacity}t` : ''}
                                                {shipAtSea ? ` → ${destName}` : ''}
                                            </div>
                                        </div>

                                        <span style={{
                                            flexShrink:   0,
                                            fontSize:     '10px',
                                            fontWeight:   600,
                                            padding:      '2px 7px',
                                            borderRadius: '10px',
                                            whiteSpace:   'nowrap',
                                            background: seized
                                                ? '#3f3f46'
                                                : ship.status === ShipStatus.LOADING
                                                    ? '#4a2800'
                                                    : ship.status === ShipStatus.LOADED
                                                        ? '#b68d40'
                                                        : !shipAtSea
                                                            ? '#1b5e20'
                                                            : ship.status === ShipStatus.AWAITING_PILOT ? '#4a3800' : '#0d47a1',
                                            color: seized
                                                ? '#d4d4d8'
                                                : ship.status === ShipStatus.LOADING
                                                    ? '#ffcc80'
                                                    : ship.status === ShipStatus.LOADED
                                                        ? '#fff3e0'
                                                        : !shipAtSea
                                                            ? '#a5d6a7'
                                                            : ship.status === ShipStatus.AWAITING_PILOT ? '#ffe082' : '#90caf9',
                                        }}>
                                            {seized
                                                ? '⚖ SEIZED'
                                                : ship.status === ShipStatus.LOADING
                                                    ? '📦 LOADING'
                                                    : ship.status === ShipStatus.LOADED
                                                        ? '📦 LOADED'
                                                        : !shipAtSea
                                                            ? '⚓ DOCKED'
                                                            : ship.status === ShipStatus.AWAITING_PILOT ? '🔔 PILOT?' : '⛵ AT SEA'}
                                        </span>
                                    </div>

                                    {onReserve && (
                                        <div>
                                            <div style={{
                                                display:        'flex',
                                                justifyContent: 'space-between',
                                                fontSize:       '11px',
                                                marginBottom:   '3px',
                                                gap:            '4px',
                                            }}>
                                                <span
                                                    style={{ color: '#7dd3fc' }}
                                                    title="Auto-refuelling reserve tank for the blockade detour — empties exactly on arrival."
                                                >
                                                    Reserve Tank
                                                </span>
                                                <span style={{ color: '#7dd3fc', fontWeight: 600, flexShrink: 0 }}>
                                                    {reservePct}%
                                                </span>
                                            </div>
                                            <StatusBar value={reservePct} colorFn={() => '#38bdf8'} />
                                        </div>
                                    )}

                                    <div>
                                        <div style={{
                                            display:        'flex',
                                            justifyContent: 'space-between',
                                            fontSize:       '11px',
                                            marginBottom:   '3px',
                                            gap:            '4px',
                                        }}>
                                            <span style={{ color: fuel <= 30 ? '#ff9800' : 'var(--text-muted)' }}>
                                                ⛽ Fuel {fuel <= 30 ? '⚠' : ''}
                                            </span>
                                            <span style={{ color: fuelColor(fuel), fontWeight: 600, flexShrink: 0 }}>
                                                {fuel}%
                                            </span>
                                        </div>
                                        <StatusBar value={fuel} colorFn={fuelColor} />
                                    </div>

                                    <div>
                                        <div style={{
                                            display:        'flex',
                                            justifyContent: 'space-between',
                                            fontSize:       '11px',
                                            marginBottom:   '3px',
                                            gap:            '4px',
                                        }}>
                                            <span style={{ color: isCritical && !shipAtSea ? '#f44336' : 'var(--text-muted)' }}>
                                                🛡 Hull {isCritical && !shipAtSea ? '⚠ CRITICAL' : ''}
                                            </span>
                                            <span style={{ color: hullColor(hpPercentage), fontWeight: 600, flexShrink: 0 }}>
                                                {hpPercentage}%
                                            </span>
                                        </div>
                                        <StatusBar value={hpPercentage} colorFn={hullColor} />
                                        {isCritical && !shipAtSea && (
                                            <div style={{ fontSize: '10px', color: '#f44336', marginTop: '3px' }}>
                                                Cannot sail below 20% HP!
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', overflow: 'hidden' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleRefuel(ship)}
                                            disabled={!canRefuel || isLoading}
                                            style={{
                                                fontSize:      '11px',
                                                padding:       '8px 4px',
                                                display:       'flex',
                                                flexDirection: 'column',
                                                alignItems:    'center',
                                                gap:           '2px',
                                            }}
                                        >
                                            <span>{tankFull ? 'Full' : 'Refuel'}</span>
                                            {!tankFull && (
                                                <span style={{ fontSize: '10px', opacity: 0.85 }}>
                                                    {refuelCost.toLocaleString()}🪙
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleRepair(ship)}
                                            disabled={!canRepair || isLoading}
                                            style={{
                                                fontSize:      '11px',
                                                padding:       '8px 4px',
                                                display:       'flex',
                                                flexDirection: 'column',
                                                alignItems:    'center',
                                                gap:           '2px',
                                                background:    !hullFull && isCritical ? '#c62828' : undefined,
                                            }}
                                        >
                                            <span>{hullFull ? 'Hull OK' : 'Repair'}</span>
                                            {!hullFull && (
                                                <span style={{ fontSize: '10px', opacity: 0.85 }}>
                                                    {repairCost.toLocaleString()}🪙
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleUnload(ship)}
                                            disabled={!canUnload || isLoading}
                                            style={{
                                                fontSize:   '11px',
                                                padding:    '8px 4px',
                                                overflow:   'hidden',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {canUnload ? 'Unload' : 'Done'}
                                        </button>
                                    </div>

                                    {canSetSail && otherPorts.length > 0 && (() => {
                                        const destBlocked      = !!(destDraft && isRouteBlocked?.(shipOrigin, destDraft));
                                        const destHasAltRoute  = destBlocked && !!hasAlternativeRoute?.(shipOrigin, destDraft);
                                        const destFullyBlocked = destBlocked && !destHasAltRoute;
                                        return (
                                        <div style={{
                                            borderTop:  '1px dashed #333',
                                            paddingTop: '8px',
                                            marginTop:  '4px',
                                        }}>
                                            <div style={{
                                                fontSize:      '10px',
                                                color:         'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                marginBottom:  '6px',
                                            }}>
                                                ⛵ Set Sail
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                                                <select
                                                    className="form-input"
                                                    value={destDraft}
                                                    onChange={e => {
                                                        const dest = e.target.value;
                                                        setSailDest(prev => ({
                                                            ...prev,
                                                            [ship.id]: dest,
                                                        }));
                                                        onPreviewRoute?.(shipOrigin, dest || null);
                                                    }}
                                                    disabled={isLoading}
                                                    title={
                                                        destFullyBlocked ? 'Politically blocked – no alternative'
                                                        : destHasAltRoute ? 'Alternative route active – longer voyage'
                                                        : undefined
                                                    }
                                                    style={{
                                                        flex: 1, fontSize: '11px', padding: '6px 8px', minWidth: 0,
                                                        ...(destFullyBlocked ? {
                                                            color: '#fca5a5',
                                                            borderColor: '#dc2626',
                                                            background: '#2a1414',
                                                        } : destHasAltRoute ? {
                                                            color: '#7dd3fc',
                                                            borderColor: '#0284c7',
                                                            background: '#0c2438',
                                                        } : {}),
                                                    }}
                                                >
                                                    <option value="">— Choose destination —</option>
                                                    {otherPorts.map(p => {
                                                        const blocked = isRouteBlocked?.(shipOrigin, p.id);
                                                        const hasAlt  = hasAlternativeRoute?.(shipOrigin, p.id);
                                                        if (blocked && !hasAlt) {
                                                            return (
                                                                <option
                                                                    key={p.id}
                                                                    value={p.id}
                                                                    disabled
                                                                    title="Politically blocked – no alternative"
                                                                    style={{ color: '#888' }}
                                                                >
                                                                    {`${p.name} (blocked)`}
                                                                </option>
                                                            );
                                                        }
                                                        if (blocked && hasAlt) {
                                                            return (
                                                                <option
                                                                    key={p.id}
                                                                    value={p.id}
                                                                    title="Alternative route active – longer voyage"
                                                                    style={{ color: '#7dd3fc' }}
                                                                >
                                                                    {`${p.name} (alternative active)`}
                                                                </option>
                                                            );
                                                        }
                                                        return (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        );
                                                    })}
                                                </select>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleSail(ship, destDraft)}
                                                    disabled={isLoading || !destDraft || destFullyBlocked
                                                        || (destHasAltRoute && !tankFull)}
                                                    title={
                                                        destFullyBlocked ? 'Politically blocked – no alternative'
                                                        : destHasAltRoute && !tankFull ? 'The detour needs a full tank (reserve tank) – refuel first'
                                                        : destHasAltRoute ? 'Sail the alternative route (longer voyage, runs on the reserve tank)'
                                                        : undefined
                                                    }
                                                    style={{
                                                        fontSize:   '11px',
                                                        padding:    '6px 12px',
                                                        flexShrink: 0,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {isLoading ? '…' : (destHasAltRoute ? 'Sail (Alt)' : 'Sail')}
                                                </button>
                                            </div>
                                            {destFullyBlocked && (
                                                <div style={{
                                                    fontSize:   '10px',
                                                    color:      '#fca5a5',
                                                    marginTop:  '4px',
                                                }}>
                                                    Politically blocked – no alternative available
                                                </div>
                                            )}
                                            {destHasAltRoute && (
                                                <div style={{
                                                    fontSize:   '10px',
                                                    color:      tankFull ? '#7dd3fc' : '#fbbf24',
                                                    marginTop:  '4px',
                                                }}>
                                                    Primary route blocked – alternative route active (longer voyage).
                                                    {' '}This detour is far longer than your tank, so the ship runs on
                                                    its onboard reserve tank that refuels underway: it costs exactly
                                                    one full tank to set off.
                                                    {!tankFull && ' ⛽ Refuel to a full tank first.'}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })()}

                                    {seized && (
                                        <div style={{
                                            borderTop:  '1px dashed #52525b',
                                            paddingTop: '8px',
                                            marginTop:  '4px',
                                            fontSize:   '11px',
                                            color:      '#a1a1aa',
                                            background: 'rgba(63,63,70,0.25)',
                                            borderRadius: '4px',
                                            padding:    '8px',
                                        }}>
                                            ⚖ This ship was repossessed by the bank after a defaulted mortgage.
                                            It can no longer set sail.
                                        </div>
                                    )}

                                    {!shipAtSea && (shipCargo[ship.id] ?? []).length > 0 && (
                                        <div style={{
                                            borderTop:  '1px solid #333',
                                            paddingTop: '8px',
                                            marginTop:  '4px',
                                        }}>
                                            <div style={{
                                                fontSize:      '10px',
                                                color:         'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                marginBottom:  '6px',
                                            }}>
                                                Loaded cargo
                                            </div>
                                            {(shipCargo[ship.id] ?? []).map(contract => {
                                                const penalty = Math.floor((contract.reward ?? 0) / 2);
                                                const isLate = contract.expiresAtTick != null
                                                    && currentTick > contract.expiresAtTick;
                                                const lateTicks = isLate ? currentTick - contract.expiresAtTick : 0;
                                                return (
                                                    <div key={contract.id} style={{
                                                        display:        'flex',
                                                        alignItems:     'center',
                                                        justifyContent: 'space-between',
                                                        gap:            '8px',
                                                        fontSize:       '11px',
                                                        padding:        '4px 0',
                                                    }}>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{
                                                                overflow:     'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace:   'nowrap',
                                                            }}>
                                                                → {contract.destinationPortName || '—'}
                                                            </div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                                                {contract.reward?.toLocaleString() ?? 0}🪙
                                                                {isLate && (
                                                                    <span style={{ color: '#f59e0b', marginLeft: '6px' }}>
                                                                        ⚠ {lateTicks} day{lateTicks === 1 ? '' : 's'} late
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => setForfeitConfirm({
                                                                shipId: ship.id,
                                                                contract,
                                                                penalty,
                                                            })}
                                                            disabled={isLoading}
                                                            style={{
                                                                fontSize:   '10px',
                                                                padding:    '4px 8px',
                                                                flexShrink: 0,
                                                            }}
                                                            title={`Forfeit (50 % penalty: ${penalty.toLocaleString()}🪙)`}
                                                        >
                                                            Forfeit
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {renderContracts(ship)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </>
    );
}