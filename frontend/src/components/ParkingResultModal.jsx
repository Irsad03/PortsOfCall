import { FocusTrap } from './FocusTrap';

export default function ParkingResultModal({ result, onClose }) {
    if (!result) {
        return (
            <div style={{
                position:        'fixed',
                inset:           0,
                backgroundColor: 'rgba(0,0,0,0.75)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          3000,
            }}>
                <FocusTrap style={{
                    backgroundColor: '#1a1f2e',
                    border:          '2px solid rgba(120,180,255,0.35)',
                    borderRadius:    '14px',
                    padding:         '36px 40px',
                    maxWidth:        '320px',
                    width:           '90%',
                    textAlign:       'center',
                    boxShadow:       '0 12px 40px rgba(0,0,0,0.8)',
                }}>
                    <div style={{
                        width:         40,
                        height:        40,
                        margin:        '0 auto 16px',
                        border:        '3px solid rgba(120,180,255,0.25)',
                        borderTopColor: '#7bb8ff',
                        borderRadius:  '50%',
                        animation:     'parkingResultSpin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#c8dcf0', margin: 0, fontSize: 14 }}>
                        Reporting docking to the harbour master…
                    </p>
                    <style>{`@keyframes parkingResultSpin { to { transform: rotate(360deg); } }`}</style>
                </FocusTrap>
            </div>
        );
    }

    const { success, message, damageApplied, remainingHp } = result;

    const accentColor = success ? '#48bb78' : '#fc5c5c';
    const bgGlow      = success
        ? 'rgba(72,187,120,0.08)'
        : 'rgba(252,92,92,0.08)';

    return (
        <div style={{
            position:        'fixed',
            inset:           0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          3000,
        }}>
            <FocusTrap style={{
                backgroundColor: '#1a1f2e',
                border:          `2px solid ${accentColor}55`,
                borderRadius:    '14px',
                padding:         '32px 36px',
                maxWidth:        '400px',
                width:           '90%',
                boxShadow:       `0 0 40px ${accentColor}22, 0 12px 40px rgba(0,0,0,0.8)`,
                background:      `linear-gradient(160deg, #1a1f2e 70%, ${bgGlow})`,
                textAlign:       'center',
            }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                    {success ? '⚓' : '💥'}
                </div>
                <h3 style={{
                    margin:    '0 0 6px',
                    color:     accentColor,
                    fontSize:  '22px',
                    textShadow: `0 0 12px ${accentColor}88`,
                }}>
                    {success ? 'Docked Successfully!' : 'Rough Docking!'}
                </h3>

                <p style={{
                    margin:    '10px 0 18px',
                    color:     'var(--text-secondary, #c8dcf0)',
                    fontSize:  '14px',
                    lineHeight: 1.5,
                }}>
                    {message}
                </p>

                <div style={{
                    display:         'flex',
                    justifyContent:  'center',
                    gap:             '24px',
                    marginBottom:    '22px',
                }}>
                    <div style={{
                        background:   'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding:      '10px 18px',
                        minWidth:     '90px',
                    }}>
                        <div style={{ fontSize: '11px', color: '#7a8fa6', marginBottom: '4px' }}>
                            DAMAGE TAKEN
                        </div>
                        <div style={{
                            fontSize:   '24px',
                            fontWeight: 700,
                            color:      damageApplied > 0 ? '#fc5c5c' : '#48bb78',
                        }}>
                            {damageApplied > 0 ? `-${damageApplied} HP` : '0 HP'}
                        </div>
                    </div>

                    <div style={{
                        background:   'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding:      '10px 18px',
                        minWidth:     '90px',
                    }}>
                        <div style={{ fontSize: '11px', color: '#7a8fa6', marginBottom: '4px' }}>
                            HULL INTEGRITY
                        </div>
                        <div style={{
                            fontSize:   '24px',
                            fontWeight: 700,
                            color:      remainingHp > 50 ? '#48bb78'
                                      : remainingHp > 25 ? '#f0a500'
                                      : '#fc5c5c',
                        }}>
                            {remainingHp} HP
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={onClose}
                    style={{ width: '100%', fontSize: '15px', padding: '10px' }}
                    autoFocus
                >
                    Continue Voyage →
                </button>
            </FocusTrap>
        </div>
    );
}
