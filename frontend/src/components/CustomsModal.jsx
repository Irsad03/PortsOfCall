import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FocusTrap } from './FocusTrap';

const BRIBE_THRESHOLD_MULTIPLIER = 0.75;

export default function CustomsModal({ myPlayerId, players }) {
    const { customsInspection, setCustomsInspection, refreshMyBalance } = useGame();

    const [showBribe, setShowBribe]     = useState(false);
    const [bribeAmount, setBribeAmount] = useState(0);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [processing, setProcessing]   = useState(false);
    const [processingTicks, setProcessingTicks] = useState(0);

    if (!customsInspection) return null;

    const { shipId, hasIllegalGoods, illegalValue } = customsInspection;
    const player   = players?.find(p => p.playerId === myPlayerId);
    const maxBribe = player?.money ?? 0;

    const bribeThreshold = (illegalValue ?? 0) * BRIBE_THRESHOLD_MULTIPLIER;
    const estimatedProbability = bribeThreshold > 0
        ? Math.min(1.0, bribeAmount / bribeThreshold)
        : 0;

    function bribeColor(p) {
        if (p >= 0.7) return '#4caf50';
        if (p >= 0.3) return '#ff9800';
        return '#f44336';
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/customs/${shipId}/submit?playerId=${myPlayerId}`,
                { method: 'POST' }
            );
            if (!res.ok) throw new Error(await res.text());
            const statusDto = await res.json();
            setProcessingTicks(statusDto.holdRemainingTicks ?? 0);
            setProcessing(true);
        } catch (err) {
            setError(err.message || 'Request failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleBribe() {
        if (bribeAmount <= 0) { setError('Enter an amount greater than 0.'); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/customs/${shipId}/bribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: myPlayerId, amount: bribeAmount }),
            });
            if (!res.ok) throw new Error(await res.text());
            const statusDto = await res.json();
            setProcessingTicks(statusDto.holdRemainingTicks ?? 0);
            setProcessing(true);
            refreshMyBalance(myPlayerId);
        } catch (err) {
            setError(err.message || 'Request failed.');
        } finally {
            setLoading(false);
        }
    }

    if (processing) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000,
            }}>
                <FocusTrap style={{
                    backgroundColor: '#1a1f2e',
                    border: '2px solid rgba(255,160,0,0.35)',
                    borderRadius: '12px',
                    padding: '32px 28px',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                }}>
                    <h3 style={{ margin: '0 0 10px', color: '#ffa000' }}>Under Review</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px' }}>
                        Customs officers are processing your case. The result will be
                        revealed in approximately{' '}
                        <strong style={{ color: '#fff' }}>
                            {processingTicks} day{processingTicks !== 1 ? 's' : ''}
                        </strong>.
                    </p>
                    <div style={{
                        background: 'rgba(255,160,0,0.08)',
                        border: '1px solid rgba(255,160,0,0.2)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#ffcc80',
                        marginBottom: '20px',
                    }}>
                        ⏳ Your ship is held at the dock and cannot depart until the review is complete.
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => setCustomsInspection(null)}
                        autoFocus
                    >
                        Close
                    </button>
                </FocusTrap>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
        }}>
            <FocusTrap style={{
                backgroundColor: '#1a1f2e',
                border: '2px solid rgba(255,160,0,0.35)',
                borderRadius: '12px',
                padding: '28px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            }}>
                <h3 style={{ marginTop: 0, color: '#ffa000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Customs Control
                </h3>

                <p style={{ margin: '10px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Your ship has been selected for inspection.
                    {hasIllegalGoods
                        ? ' Your manifest contains flagged cargo — choose carefully.'
                        : ' Your manifest appears clean.'}
                </p>

                {hasIllegalGoods && (
                    <div style={{
                        background: 'rgba(244,67,54,0.1)',
                        border: '1px solid rgba(244,67,54,0.3)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#ef9a9a',
                        marginBottom: '14px',
                    }}>
                        Illegal goods detected in your manifest. If found during search, they will be confiscated and you will be fined.
                    </div>
                )}

                {error && (
                    <p style={{ color: '#ff6b6b', fontSize: '13px', margin: '8px 0' }}>{error}</p>
                )}

                {showBribe && hasIllegalGoods && (
                    <div style={{
                        background: 'rgba(255,160,0,0.06)',
                        border: '1px solid rgba(255,160,0,0.2)',
                        borderRadius: '8px',
                        padding: '14px',
                        marginBottom: '14px',
                    }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Bribe Amount
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>🪙</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={maxBribe}
                                step={100}
                                value={bribeAmount === 0 ? '' : bribeAmount}
                                placeholder="0"
                                onChange={e => {
                                    const raw = Number(e.target.value);
                                    if (e.target.value === '' || Number.isNaN(raw)) { setBribeAmount(0); return; }
                                    setBribeAmount(Math.max(0, Math.min(maxBribe, Math.round(raw))));
                                }}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: '10px 12px',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    background: '#11151f',
                                    border: `1px solid ${bribeColor(estimatedProbability)}`,
                                    borderRadius: '6px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>
                            <span>Available: {maxBribe.toLocaleString()}🪙</span>
                            <button
                                type="button"
                                onClick={() => setBribeAmount(maxBribe)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ffcc80',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Max
                            </button>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <span>Estimated Success Chance</span>
                                <span style={{ color: bribeColor(estimatedProbability), fontWeight: 700 }}>
                                    {Math.round(estimatedProbability * 100)}%
                                </span>
                            </div>
                            <div style={{ background: '#1e1e1e', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${estimatedProbability * 100}%`,
                                    height: '100%',
                                    background: bribeColor(estimatedProbability),
                                    transition: 'width 0.2s ease, background 0.2s ease',
                                }} />
                            </div>
                        </div>

                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                            A rejected bribe guarantees 100% detection. The result is revealed after processing.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    {!showBribe ? (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ flex: 1 }}
                                autoFocus
                            >
                                {loading ? 'Processing…' : 'Submit to Search'}
                            </button>

                            {hasIllegalGoods && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => { setShowBribe(true); setError(null); }}
                                    disabled={loading}
                                    style={{ flex: 1, background: '#b8860b', borderColor: '#b8860b' }}
                                >
                                    Offer Bribe
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowBribe(false); setError(null); }}
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                ← Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBribe}
                                disabled={loading || bribeAmount <= 0}
                                style={{ flex: 1, background: '#b8860b', borderColor: '#b8860b' }}
                            >
                                {loading ? 'Processing…' : `Pay ${bribeAmount.toLocaleString()}🪙`}
                            </button>
                        </>
                    )}
                </div>
            </FocusTrap>
        </div>
    );
}
