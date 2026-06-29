import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { FocusTrap } from './FocusTrap';

export default function InspectionResultModal() {
    const { customsResult, setCustomsResult, refreshMyBalance, myPlayerId } = useGame();

    useEffect(() => {
        if (customsResult && myPlayerId) {
            refreshMyBalance(myPlayerId);
        }
    }, [customsResult, myPlayerId, refreshMyBalance]);

    if (!customsResult) return null;

    const isBribeResult   = 'accepted' in customsResult;
    const cleared = isBribeResult ? customsResult.accepted : !customsResult.detected;
    const confiscated     = customsResult.confiscatedContractIds ?? [];
    const fine            = customsResult.totalFine ?? 0;
    const holdTicks       = customsResult.holdTicks ?? 0;
    const bribeAmount     = customsResult.bribeAmount;
    const successProb     = customsResult.successProbability;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
        }}>
            <FocusTrap style={{
                backgroundColor: '#1a1f2e',
                border: `2px solid ${cleared ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)'}`,
                borderRadius: '12px',
                padding: '28px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h3 style={{
                        margin: '10px 0 4px',
                        color: cleared ? '#81c784' : '#ef5350',
                    }}>
                        {cleared
                            ? (isBribeResult ? 'Bribe Accepted' : 'Inspection Cleared')
                            : (isBribeResult ? 'Bribe Rejected — Penalized' : 'Illegal Goods Found')}
                    </h3>
                </div>

                {isBribeResult && bribeAmount !== undefined && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginBottom: '12px',
                    }}>
                        Bribe paid: <strong style={{ color: 'var(--text-primary)' }}>{bribeAmount?.toLocaleString()}🪙</strong>
                        {successProb !== undefined && (
                            <span> · Success chance was {Math.round(successProb * 100)}%</span>
                        )}
                    </div>
                )}

                {cleared && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 12px' }}>
                        No violations found. Your ship is being held for processing and will be
                        released in <strong style={{ color: '#fff' }}>{holdTicks} day{holdTicks !== 1 ? 's' : ''}</strong>.
                    </p>
                )}

                {!cleared && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 10px' }}>
                            Your ship has been penalized and will be held for{' '}
                            <strong style={{ color: '#fff' }}>{holdTicks} day{holdTicks !== 1 ? 's' : ''}</strong>.
                        </p>

                        {fine > 0 && (
                            <div style={{
                                background: 'rgba(244,67,54,0.1)',
                                border: '1px solid rgba(244,67,54,0.25)',
                                borderRadius: '6px',
                                padding: '10px 14px',
                                marginBottom: '10px',
                            }}>
                                <div style={{ fontSize: '11px', color: '#ef9a9a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Total Fine
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f44336' }}>
                                    − {fine.toLocaleString()}🪙
                                </div>
                            </div>
                        )}

                        {confiscated.length > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px',
                                padding: '10px 14px',
                                marginBottom: '10px',
                            }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Confiscated Cargo ({confiscated.length})
                                </div>
                                {confiscated.map(id => (
                                    <div key={id} style={{ fontSize: '11px', color: '#ef9a9a', marginBottom: '2px' }}>
                                        • Illegal goods
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <div style={{
                    background: 'rgba(255,160,0,0.08)',
                    border: '1px solid rgba(255,160,0,0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#ffcc80',
                    marginBottom: '16px',
                }}>
                    Ship unavailable for {holdTicks} day{holdTicks !== 1 ? 's' : ''}. Status will return to IDLE automatically.
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => setCustomsResult(null)}
                    style={{ width: '100%' }}
                    autoFocus
                >
                    Understood
                </button>
            </FocusTrap>
        </div>
    );
}
