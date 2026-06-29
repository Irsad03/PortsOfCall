import { useMemo, useState } from 'react';

export default function Leaderboard({ players = [], myPlayerId }) {
    const netOf = (p) => p.netWorth ?? p.money ?? 0;
    const ranked = useMemo(
        () => [...players].sort((a, b) => netOf(b) - netOf(a)),
        [players],
    );

    const leaderId = ranked[0]?.playerId ?? null;

    const [prevLeader, setPrevLeader] = useState(leaderId);
    const [flashKey, setFlashKey] = useState(0);
    if (leaderId !== prevLeader) {
        setPrevLeader(leaderId);
        if (prevLeader != null && leaderId != null) setFlashKey(k => k + 1);
    }

    const [open, setOpen] = useState(false);

    if (ranked.length === 0) return null;

    return (
        <div className="leaderboard">
            <button
                type="button"
                className="leaderboard-fab"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                title="Leaderboard"
            >
                🏆
            </button>
            <div className={`leaderboard-overlay${open ? ' open' : ''}`}>
                <div className="leaderboard-title">🏆 Leaderboard</div>
                <div className="leaderboard-list">
                    {ranked.map((p, i) => {
                        const classes = ['leaderboard-row'];
                        if (p.playerId === myPlayerId) classes.push('me');
                        if (i === 0) classes.push('first');
                        if (i === 0 && flashKey > 0) classes.push('flash');
                        return (
                            <div
                                key={i === 0 ? `lead-${flashKey}` : p.playerId}
                                className={classes.join(' ')}
                            >
                                <span className="lb-rank">{i + 1}</span>
                                <span className="lb-name">{p.name}</span>
                                <span className="lb-money">{netOf(p).toLocaleString()}🪙</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
