import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameService } from '../api/gameService';
import { ShipStatus } from '../constants/ShipStatus';
import ParkingGame from './ParkingGame';
import ParkingResultModal from './ParkingResultModal';
import { FocusTrap } from './FocusTrap';

const PILOT_HIRE_COST = 500;

export default function PilotModal({ myPlayerId }) {
    const { pilotRequest, setPilotRequest, players, updatePlayerState, refreshMyBalance, activeShips, isPilotStrikeAtPort } = useGame();

    const [stage,         setStage]         = useState('pilot');
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);
    const [parkingResult, setParkingResult] = useState(null);

    useEffect(() => {
        if (pilotRequest) {
            setStage('pilot');
            setError(null);
            setParkingResult(null);
        }
    }, [pilotRequest?.shipId]);

    const handleGameComplete = useCallback(async (success, score) => {
        if (!pilotRequest) return;
        setParkingResult(null);
        setStage('result');
        try {
            const res = await gameService.submitParkingResult(
                pilotRequest.playerId,
                pilotRequest.shipId,
                success,
                score,
            );
            setParkingResult(res);
        } catch (err) {
            console.error('submitParkingResult failed', err);
            setParkingResult({
                shipId:        pilotRequest.shipId,
                success,
                message:       success ? 'Well steered!' : 'Rough docking!',
                damageApplied: success ? 0 : 15,
                remainingHp:   0,
            });
        }
    }, [pilotRequest]);

    if (!pilotRequest) return null;

    const currentPlayer  = players.find(p => p.playerId === pilotRequest.playerId);
    const canAfford      = currentPlayer && currentPlayer.money >= PILOT_HIRE_COST;
    const approachingShip = activeShips?.find(s => s.shipId === pilotRequest.shipId);
    const shipName =
        approachingShip?.shipName ??
        (currentPlayer?.currentShip?.id === pilotRequest.shipId
            ? currentPlayer.currentShip.name
            : null);

    const pilotStriking = isPilotStrikeAtPort(pilotRequest.destinationPortId);

    async function handleHirePilot() {
        if (!currentPlayer || !canAfford) return;
        try {
            setLoading(true);
            setError(null);
            const response = await gameService.hirePilot(currentPlayer.playerId, pilotRequest.shipId);
            updatePlayerState(currentPlayer.playerId, {
                money: response.remainingMoney,
                currentShip: {
                    ...currentPlayer.currentShip,
                    hasPilot: response.hasPilot,
                    status:   ShipStatus.IN_TRANSIT,
                },
            });
            refreshMyBalance(currentPlayer.playerId);
            setPilotRequest(null);
        } catch (err) {
            console.error('Hire pilot failed', err);
            setError(err.message || 'Failed to hire pilot.');
        } finally {
            setLoading(false);
        }
    }

    async function handleNavigateSelf() {
        if (!currentPlayer) return;
        try {
            setLoading(true);
            setError(null);
            await gameService.navigateSelf(currentPlayer.playerId, pilotRequest.shipId);
            setStage('intro');
        } catch (err) {
            console.error('Navigate self failed', err);
            setError(err.message || 'Failed to start navigation.');
        } finally {
            setLoading(false);
        }
    }

    function handleResultClose() {
        if (parkingResult && currentPlayer) {
            updatePlayerState(currentPlayer.playerId, {
                currentShip: {
                    ...currentPlayer.currentShip,
                    healthPoints: parkingResult.remainingHp,
                    status:       ShipStatus.IN_TRANSIT,
                },
            });
        }
        setParkingResult(null);
        setPilotRequest(null);
        setStage('pilot');
    }

    if (stage === 'result') {
        return (
            <ParkingResultModal
                result={parkingResult}
                onClose={handleResultClose}
            />
        );
    }

    if (stage === 'game') {
        return <ParkingGame onComplete={handleGameComplete} shipName={shipName} />;
    }

    if (stage === 'intro') {
        return (
            <div style={{
                position:        'fixed',
                inset:           0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          2000,
            }}>
                <FocusTrap style={{
                    backgroundColor: '#1a1f2e',
                    border:          '2px solid rgba(15,240,252,0.25)',
                    borderRadius:    '12px',
                    padding:         '30px',
                    maxWidth:        '440px',
                    width:           '90%',
                    boxShadow:       '0 12px 40px rgba(0,0,0,0.8)',
                }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>
                        🚢 Navigate Yourself — How It Works
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                        Steer{shipName ? <> <strong>{shipName}</strong></> : ' your ship'} through the harbour
                        without a pilot and dock at the <span style={{ color: '#48bb78' }}>green dock</span>.
                    </p>

                    <ul style={{
                        color:      'var(--text-secondary)',
                        fontSize:   '14px',
                        lineHeight: 1.8,
                        paddingLeft: '18px',
                    }}>
                        <li>
                            <kbd style={kbdStyle}>↑</kbd> Forward &nbsp;
                            <kbd style={kbdStyle}>↓</kbd> Brake / Reverse
                        </li>
                        <li>
                            <kbd style={kbdStyle}>←</kbd> / <kbd style={kbdStyle}>→</kbd> Steer left / right
                        </li>
                        <li>
                            The ship has <strong>inertia</strong> — it keeps gliding when you release the keys.
                            The rudder responds best at full speed.
                        </li>
                        <li>
                            Park the ship so the <strong>majority of the hull</strong> sits inside the
                            <span style={{ color: '#48bb78' }}> green dock</span> — then you're docked!
                        </li>
                        <li>
                            Hitting a wall, pier or crane = <strong style={{ color: '#fc5c5c' }}>−15 HP</strong> hull damage.
                        </li>
                    </ul>

                    <p style={{
                        margin:      '12px 0 20px',
                        fontSize:    '13px',
                        color:       '#f0a500',
                        background:  'rgba(240,165,0,0.08)',
                        border:      '1px solid rgba(240,165,0,0.2)',
                        borderRadius:'6px',
                        padding:     '8px 12px',
                    }}>
                        💡 Tip: Click the game area first so it captures your key presses.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={() => setStage('game')}
                        style={{ width: '100%', fontSize: '15px', padding: '10px' }}
                        autoFocus
                    >
                        Start Docking
                    </button>
                </FocusTrap>
            </div>
        );
    }

    return (
        <div style={{
            position:        'fixed',
            inset:           0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          2000,
        }}>
            <FocusTrap style={{
                backgroundColor: '#1a1f2e',
                border:          '2px solid rgba(15,240,252,0.25)',
                borderRadius:    '12px',
                padding:         '28px',
                maxWidth:        '420px',
                width:           '90%',
                boxShadow:       '0 12px 40px rgba(0,0,0,0.8)',
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>⚓ Harbor Pilot Service</h3>

                {shipName && (
                    <div style={{
                        display:       'inline-flex',
                        alignItems:    'center',
                        gap:           '6px',
                        background:    'rgba(15,240,252,0.08)',
                        border:        '1px solid rgba(15,240,252,0.2)',
                        borderRadius:  '6px',
                        padding:       '4px 10px',
                        fontSize:      '12px',
                        color:         '#c8dcf0',
                        marginBottom:  '10px',
                    }}>
                        🚢 <strong>{shipName}</strong>
                    </div>
                )}

                <p style={{ margin: '10px 0', color: 'var(--text-secondary)' }}>
                    {shipName
                        ? <><strong>{shipName}</strong> is approaching the harbor. Would you like to hire a harbor pilot for safe navigation?</>
                        : 'Your ship is approaching the harbor. Would you like to hire a harbor pilot for safe navigation?'
                    }
                </p>
                <p style={{ margin: '10px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Cost: {PILOT_HIRE_COST.toLocaleString()}🪙 | Your balance: {currentPlayer?.money?.toLocaleString() ?? 0}🪙
                </p>

                <p style={{ margin: '8px 0 4px', fontSize: '13px', color: '#f0a500' }}>
                    Your ship is waiting — choose an option to continue docking.
                </p>

                {pilotStriking && (
                    <p style={{
                        margin:       '8px 0',
                        fontSize:     '13px',
                        color:        '#fc5c5c',
                        background:   'rgba(252,92,92,0.08)',
                        border:       '1px solid rgba(252,92,92,0.25)',
                        borderRadius: '6px',
                        padding:      '8px 12px',
                    }}>
                        🚨 Harbour pilots are on strike at this port. Hiring a pilot is
                        unavailable — you must dock manually.
                    </p>
                )}

                {error && (
                    <p style={{ color: '#ff6b6b', fontSize: '13px', margin: '8px 0' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <span
                        style={{ flex: 1, display: 'flex' }}
                        title={pilotStriking
                            ? 'Harbour pilots are on strike at this port — you must dock manually via the parking minigame.'
                            : undefined}
                    >
                        <button
                            className="btn btn-primary"
                            onClick={handleHirePilot}
                            disabled={!canAfford || loading || pilotStriking}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Processing…' : 'Hire Pilot'}
                        </button>
                    </span>
                    <button
                        className="btn btn-secondary"
                        onClick={handleNavigateSelf}
                        disabled={loading}
                        style={{ flex: 1 }}
                    >
                        {loading ? 'Processing…' : 'Navigate Myself'}
                    </button>
                </div>

                {!canAfford && !pilotStriking && (
                    <p style={{ marginTop: '10px', color: '#ff6b6b', fontSize: '13px' }}>
                        Insufficient funds to hire pilot.
                    </p>
                )}
            </FocusTrap>
        </div>
    );
}

const kbdStyle = {
    display:         'inline-block',
    background:      'rgba(255,255,255,0.1)',
    border:          '1px solid rgba(255,255,255,0.25)',
    borderRadius:    '4px',
    padding:         '1px 6px',
    fontFamily:      'monospace',
    fontSize:        '12px',
    color:           '#c8dcf0',
};
