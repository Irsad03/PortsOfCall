import { useState, useEffect } from 'react';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';

export default function LobbyView({ sessionCode, myPlayerId, myPlayerName, isCreator, onGameStarted }) {
    const { sessionId, lobbyPlayers, connected, gameStarted } = useGame();
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (gameStarted) {
            onGameStarted();
        }
    }, [gameStarted]);

    async function handleStartSession() {
        if (!sessionId) return;
        setLoading(true);
        setApiError(null);
        try {
            await gameService.startSession(sessionId, myPlayerId);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function copyCode() {
        navigator.clipboard.writeText(sessionCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="card" style={{ minWidth: 420, maxWidth: 500 }}>
            <div className="card-header">
                <h2 style={{ margin: 0 }}>Waiting...</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    <span className={`status-indicator ${connected ? 'status-online' : 'status-offline'}`} />
                    <span style={{ color: 'var(--pirate-text-muted)' }}>
                        {connected ? 'Connected' : 'Connect…'}
                    </span>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.42rem',
                    letterSpacing: '2px',
                    color: 'var(--pirate-text-muted)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase'
                }}>
                    Fleet-Code — share it with your crew
                </div>
                <div
                    className="session-code-display"
                    onClick={copyCode}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy"
                >
                    {sessionCode}
                </div>
                {copied && (
                    <div style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '0.38rem',
                        color: 'var(--color-success)',
                        marginTop: '6px',
                        letterSpacing: '2px'
                    }}>
                        ✓ Copied!
                    </div>
                )}
            </div>

            <div className="pirate-divider" />

            <h3 style={{ marginBottom: '0.6rem' }}>
                Crew ({lobbyPlayers.length})
            </h3>

            <ul>
                {lobbyPlayers.map((p, i) => (
                    <li key={i} style={p.name === myPlayerName ? {
                        borderLeftColor: 'var(--pirate-gold)',
                        color: 'var(--pirate-gold-bright)'
                    } : {}}>
                        {p.name === myPlayerName ? '★ ' : '◆ '}
                        {p.name}
                        {p.name === myPlayerName && (
                            <span style={{ color: 'var(--pirate-text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>
                                (du)
                            </span>
                        )}
                    </li>
                ))}
                {lobbyPlayers.length === 0 && (
                    <li style={{ color: 'var(--pirate-text-muted)', fontStyle: 'italic' }}>
                        Waiting for other players…
                    </li>
                )}
            </ul>

            <div className="pirate-divider" />

            {apiError && <p className="text-danger">{apiError}</p>}

            {isCreator ? (
                <div>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartSession}
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', fontSize: '0.55rem', letterSpacing: '2px' }}
                    >
                        {loading ? '[ Raise anchor… ]' : 'Start!'}
                    </button>
                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--pirate-text-muted)',
                        marginTop: '0.5rem'
                    }}>
                    </p>
                </div>
            ) : (
                <p style={{
                    textAlign: 'center',
                    color: 'var(--pirate-text-muted)',
                    fontSize: '0.8rem',
                    fontStyle: 'italic'
                }}>
                    Waiting for the host...
                </p>
            )}
        </div>
    );
}
