import { useState } from 'react';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';

export default function StartScreen({ onSessionData }) {
    const { setSession } = useGame();
    const [mode, setMode] = useState('create');
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    async function handleCreateSession(e) {
        e.preventDefault();
        if (!playerName.trim()) return;
        setLoading(true);
        setApiError(null);
        try {
            const data = await gameService.createSession(playerName);
            setSession(data.id, true, data.playerId);
            onSessionData({
                sessionCode: data.code,
                myPlayerId: data.playerId,
                myPlayerName: data.playerName,
                isCreator: true
            });
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleJoinSession(e) {
        e.preventDefault();
        if (!joinCode.trim() || !playerName.trim()) return;
        setLoading(true);
        setApiError(null);
        try {
            const data = await gameService.joinSession(joinCode.trim().toUpperCase(), playerName);
            setSession(data.id, false, data.playerId);
            onSessionData({
                sessionCode: data.code,
                myPlayerId: data.playerId,
                myPlayerName: data.playerName,
                isCreator: false
            });
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card">
            <div className="button-group" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${mode === 'create' ? 'btn-primary active-mode' : 'btn-secondary'}`}
                    onClick={() => { setMode('create'); setApiError(null); }}
                >
                    New fleet
                </button>
                <button
                    className={`btn ${mode === 'join' ? 'btn-primary active-mode' : 'btn-secondary'}`}
                    onClick={() => { setMode('join'); setApiError(null); }}
                >
                    Join Session
                </button>
            </div>

            <div className="pirate-divider" />

            {mode === 'create' && (
                <form onSubmit={handleCreateSession}>
                    <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        <label style={{
                            fontFamily: 'var(--font-pixel)',
                            fontSize: '0.42rem',
                            letterSpacing: '2px',
                            color: 'var(--pirate-text-muted)',
                            textTransform: 'uppercase'
                        }}>
                            Captain's name
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Blackbeard"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                autoFocus
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading || !playerName.trim()}>
                                {loading ? 'Waiting…' : 'Start'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {mode === 'join' && (
                <form onSubmit={handleJoinSession}>
                    <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                        <div>
                            <label style={{
                                fontFamily: 'var(--font-pixel)',
                                fontSize: '0.42rem',
                                letterSpacing: '2px',
                                color: 'var(--pirate-text-muted)',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '0.4rem'
                            }}>
                                Fleet code
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="AB12"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                style={{ width: '100%', textAlign: 'center', letterSpacing: '6px', fontSize: '1.1rem' }}
                            />
                        </div>
                        <div>
                            <label style={{
                                fontFamily: 'var(--font-pixel)',
                                fontSize: '0.42rem',
                                letterSpacing: '2px',
                                color: 'var(--pirate-text-muted)',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '0.4rem'
                            }}>
                                Captain's name
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Anne Bonny"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                />
                                <button
                                    className="btn btn-primary"
                                    type="submit"
                                    disabled={loading || !joinCode.trim() || !playerName.trim()}
                                >
                                    {loading ? 'Waiting…' : 'Join'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {apiError && <p className="text-danger" style={{ marginTop: '0.75rem' }}>✕ {apiError}</p>}
        </div>
    );
}
