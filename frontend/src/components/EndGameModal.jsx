import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameService } from '../api/gameService';
import { FocusTrap } from './FocusTrap';

export default function EndGameModal({ myPlayerId, sessionId, onClose }) {
    const { endGameVote } = useGame();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [tick, setTick] = useState(Date.now());
    const canVote = Boolean(myPlayerId);

    useEffect(() => {
        if (endGameVote?.started) {
            setHasVoted(false);
        }
    }, [endGameVote?.started]);

    const cooldownUntil = endGameVote?.cooldownUntil;
    const cooldownActive = cooldownUntil && tick < cooldownUntil;
    const noVotes = endGameVote ? Math.max(0, endGameVote.totalVotes - endGameVote.yesVotes) : 0;

    useEffect(() => {
        if (!cooldownActive) return;
        const interval = setInterval(() => setTick(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [cooldownActive]);

    const formatTimeRemaining = () => {
        if (!cooldownActive) return null;
        const seconds = Math.max(0, Math.ceil((cooldownUntil - tick) / 1000));
        const minutes = Math.floor(seconds / 60);
        const remainderSeconds = seconds % 60;
        return `${minutes}:${String(remainderSeconds).padStart(2, '0')}`;
    };

    async function handleStartVote() {
        if (!canVote) {
            setError('You are not fully logged in as a player yet. Select your home port first, or reload the page.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await gameService.startEndGameVote(sessionId, myPlayerId);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVote(vote) {
        if (!canVote) {
            setError('You cannot vote yet. Your player is not fully loaded.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await gameService.voteEndGame(sessionId, myPlayerId, vote);
            setHasVoted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (endGameVote?.started && !canVote) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <FocusTrap className="modal-content endgame-modal" onClick={e => e.stopPropagation()}>
                    <div className="endgame-header">
                        <div>
                            <h2>Voting unavailable</h2>
                            <p className="text-muted">Your player is not yet fully loaded or is not known as an active session member</p>
                        </div>
                    </div>
                    <div className="endgame-card endgame-cooldown-card">
                        <p className="endgame-countdown">Please select your home port first or reload the page</p>
                    </div>
                    {error && <p className="text-danger">{error}</p>}
                    <button className="btn btn-secondary btn-block" onClick={onClose} autoFocus>Close</button>
                </FocusTrap>
            </div>
        );
    }

    if (endGameVote?.started) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <FocusTrap className="modal-content endgame-modal" onClick={e => e.stopPropagation()}>
                    <div className="endgame-header">
                        <div>
                            <h2>End Game Vote</h2>
                            <p className="text-muted">Vote now to end the current session for all players.</p>
                        </div>
                    </div>

                    <div className="endgame-card">
                        <div className="endgame-row">
                            <strong>{endGameVote.yesVotes}</strong>
                            <span>Yes votes</span>
                        </div>
                        <div className="endgame-row">
                            <strong>{noVotes}</strong>
                            <span>No votes</span>
                        </div>
                        <div className="endgame-row">
                            <strong>{Math.floor(endGameVote.totalPlayers / 2) + 1}</strong>
                            <span>Majority needed</span>
                        </div>
                    </div>

                    <div className="vote-status">
                        <p>{endGameVote.totalVotes} player{endGameVote.totalVotes === 1 ? '' : 's'} have voted.</p>
                    </div>

                    {!hasVoted ? (
                        <div className="modal-actions endgame-actions">
                            <button className="btn btn-secondary" onClick={() => handleVote(false)} disabled={loading} autoFocus>
                                Vote No
                            </button>
                            <button className="btn btn-primary" onClick={() => handleVote(true)} disabled={loading}>
                                Vote Yes
                            </button>
                        </div>
                    ) : (
                        <div className="endgame-note">
                            <p>Thank you — your vote has been recorded.</p>
                        </div>
                    )}

                    {error && <p className="text-danger">{error}</p>}
                    <button className="btn btn-secondary btn-block" onClick={onClose}>Close</button>
                </FocusTrap>
            </div>
        );
    }

    if (cooldownActive) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <FocusTrap className="modal-content endgame-modal" onClick={e => e.stopPropagation()}>
                    <div className="endgame-header">
                        <div>
                            <h2>Cooldown Active</h2>
                            <p className="text-muted">A vote was recently rejected by the majority.</p>
                        </div>
                    </div>

                    <div className="endgame-card endgame-cooldown-card">
                        <p className="endgame-countdown">Next vote available in</p>
                        <strong className="endgame-countdown-value">{formatTimeRemaining()}</strong>
                    </div>

                    <p className="text-muted">The host can start a new vote once the cooldown ends.</p>
                    <button className="btn btn-secondary btn-block" onClick={onClose} autoFocus>Close</button>
                </FocusTrap>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <FocusTrap className="modal-content endgame-modal" onClick={e => e.stopPropagation()}>
                <div className="endgame-header">
                    <div>
                        <h2>Confirm End Game</h2>
                        <p className="text-muted">Start a vote to end the session for all players.</p>
                    </div>
                </div>

                {error && <p className="text-danger">{error}</p>}
                <div className="modal-actions endgame-actions">
                    <button className="btn btn-secondary" onClick={onClose} autoFocus>Cancel</button>
                    <button className="btn btn-danger" onClick={handleStartVote} disabled={loading}>
                        {loading ? 'Starting...' : 'Start Vote'}
                    </button>
                </div>
            </FocusTrap>
        </div>
    );
}