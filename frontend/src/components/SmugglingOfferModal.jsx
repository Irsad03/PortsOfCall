import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { gameService } from '../api/gameService';
import { ShipStatus } from '../constants/ShipStatus';
import { FocusTrap } from './FocusTrap';

const FRAME_MODULES = import.meta.glob(
    '../assets/Smuggler/Smuggler*/*.{jpg,jpeg,png,webp}',
    { eager: true, query: '?url', import: 'default' }
);

function buildSmugglerCharacters() {
    const grouped = {};
    for (const [path, url] of Object.entries(FRAME_MODULES)) {
        const match = path.match(/Smuggler\/(Smuggler\d+)\//);
        if (!match) continue;
        const character = match[1];
        if (!grouped[character]) grouped[character] = [];
        grouped[character].push({ path, url });
    }
    return Object.entries(grouped)
        .map(([name, files]) => ({
            name,
            frames: files
                .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
                .map(f => f.url),
        }))
        .filter(c => c.frames.length > 0);
}

const SMUGGLERS = buildSmugglerCharacters();

const FRAME_DURATION_MS = 80;

const PHRASES = [
    'Hey, can you carry a little extra “flour” for me?',
    'Psst… I have a small shipment of “tea” that needs to travel discreetly…',
    'My friend, how about a little side business? Good money!',
    'Yo Capitano, I have something that officially does not exist…',
    'Listen — interested in some “creative” cargo?',
    'This crate here is nothing special… as long as nobody looks inside.',
    'Customs? Ah, they never look that closely. What do you say?',
    'A bit of “salt” for your voyage? Double pay!',
    'Captain! I just need a small space for some “coffee”…',
    'Do not look so stern — it is just a bit of “flour”. I promise.',
];

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function SmugglingOfferModal() {
    const { smugglingOffer, setSmugglingOffer, updatePlayerState } = useGame();
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [frameIndex, setFrameIndex] = useState(0);
    const preloadedRef = useRef(new Set());

    const character = useMemo(() => {
        if (SMUGGLERS.length === 0) return null;
        return randomPick(SMUGGLERS);
    }, [smugglingOffer?.offer?.offerId]);

    const phrase = useMemo(() => randomPick(PHRASES),
        [smugglingOffer?.offer?.offerId]);

    useEffect(() => {
        if (!character || preloadedRef.current.has(character.name)) return;
        for (const url of character.frames) {
            const img = new Image();
            img.src = url;
        }
        preloadedRef.current.add(character.name);
    }, [character]);

    useEffect(() => {
        setFrameIndex(0);
    }, [character]);

    useEffect(() => {
        if (!smugglingOffer || !character || character.frames.length <= 1) return;
        const interval = setInterval(() => {
            setFrameIndex(prev => (prev + 1) % character.frames.length);
        }, FRAME_DURATION_MS);
        return () => clearInterval(interval);
    }, [smugglingOffer, character]);

    if (!smugglingOffer) return null;

    const { offer, shipId, playerId, destinationPortName } = smugglingOffer;

    async function handleAccept() {
        setLoading(true);
        setError(null);
        try {
            await gameService.acceptSmuggling(shipId, playerId);
            updatePlayerState(playerId, { shipStatus: ShipStatus.IN_TRANSIT });
        } catch (err) {
            window.alert(err.message || 'Could not accept the offer.');
        } finally {
            setLoading(false);
            setSmugglingOffer(null);
        }
    }

    async function handleReject() {
        setLoading(true);
        try {
            await gameService.rejectSmuggling(shipId, playerId);
            updatePlayerState(playerId, { shipStatus: ShipStatus.IN_TRANSIT });
        } catch (err) {
            console.warn('Route start failed after declining smuggling offer:', err);
        } finally {
            setLoading(false);
            setSmugglingOffer(null);
        }
    }

    const portraitSrc = character?.frames?.[frameIndex] ?? null;

    return (
        <div style={styles.backdrop}>
            <FocusTrap style={styles.card}>
                <div style={styles.headerStrip}>
                    <span style={styles.headerLabel}>Black-Market Offer</span>
                </div>

                <div style={styles.scene}>
                    <div style={styles.portraitWrap}>
                        {portraitSrc ? (
                            <img
                                src={portraitSrc}
                                alt="Smuggler"
                                style={styles.portrait}
                                draggable={false}
                            />
                        ) : (
                            <div style={styles.portraitFallback}>?</div>
                        )}
                    </div>

                    <div style={styles.bubbleWrap}>
                        <div style={styles.bubble}>
                            <p style={styles.bubbleText}>{phrase}</p>
                        </div>
                        <div style={styles.bubbleTail} />
                    </div>
                </div>

                <div style={styles.details}>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Cargo</span>
                        <span style={styles.detailValue}>Illegal goods</span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Risk</span>
                        <span style={{ ...styles.detailValue, color: '#ef5350', fontWeight: 700 }}>
                            {offer.riskLevel ?? 'HIGH'}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Destination</span>
                        <span style={{ ...styles.detailValue, color: '#80cbc4', fontWeight: 600 }}>
                            {destinationPortName ?? offer.destinationPortId ?? '—'}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Volume</span>
                        <span style={styles.detailValue}>{offer.requiredCapacity} t</span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Reward</span>
                        <span style={{ ...styles.detailValue, color: '#ffd54f', fontWeight: 700 }}>
                            + {offer.reward.toLocaleString()}🪙
                        </span>
                    </div>
                    <div style={styles.warningBox}>
                        Increased inspection risk at the destination port. If discovered: cargo will
                        be confiscated and a hefty fine imposed.
                    </div>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <div style={styles.actions}>
                    <button
                        style={{ ...styles.btn, ...styles.btnReject }}
                        onClick={handleReject}
                        disabled={loading}
                        autoFocus
                    >
                        {loading ? '…' : 'Decline'}
                    </button>
                    <button
                        style={{ ...styles.btn, ...styles.btnAccept }}
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        {loading ? '…' : 'Accept'}
                    </button>
                </div>
            </FocusTrap>
        </div>
    );
}

const styles = {
    backdrop: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2100,
        padding: 'clamp(12px, 3vw, 32px)',
    },
    card: {
        width: 'min(94vw, 560px)',
        maxHeight: '92vh',
        background: 'linear-gradient(180deg, #1a1f2e 0%, #0f141e 100%)',
        border: '2px solid rgba(212,175,55,0.45)',
        borderRadius: 'clamp(10px, 1.5vw, 16px)',
        boxShadow: '0 18px 60px rgba(0,0,0,0.85), 0 0 28px rgba(212,175,55,0.15) inset',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    headerStrip: {
        background: 'linear-gradient(90deg, #5a3a0a 0%, #b8860b 50%, #5a3a0a 100%)',
        padding: 'clamp(6px, 1vw, 10px) clamp(12px, 2vw, 18px)',
        textAlign: 'center',
    },
    headerLabel: {
        color: '#fff8dc',
        fontWeight: 700,
        letterSpacing: '1.5px',
        fontSize: 'clamp(11px, 1.4vw, 14px)',
        textTransform: 'uppercase',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    },
    scene: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(10px, 2vw, 18px)',
        padding: 'clamp(16px, 2.5vw, 24px)',
        alignItems: 'flex-start',
    },
    portraitWrap: {
        flex: '0 0 auto',
        width: 'clamp(110px, 22vw, 170px)',
        aspectRatio: '1 / 1',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(212,175,55,0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        background: '#0a0d14',
    },
    portrait: {
        width: '100%', height: '100%', objectFit: 'cover',
        display: 'block',
        userSelect: 'none',
    },
    portraitFallback: {
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', fontSize: '48px',
    },
    bubbleWrap: {
        flex: '1 1 220px',
        minWidth: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    bubble: {
        background: '#fff8e1',
        color: '#2a1a05',
        borderRadius: '14px',
        padding: 'clamp(10px, 1.6vw, 16px) clamp(12px, 2vw, 18px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        position: 'relative',
        width: '100%',
    },
    bubbleText: {
        margin: 0,
        fontSize: 'clamp(13px, 1.6vw, 16px)',
        lineHeight: 1.45,
        fontStyle: 'italic',
        fontFamily: 'Georgia, "Times New Roman", serif',
    },
    bubbleTail: {
        position: 'absolute',
        left: '-12px',
        top: '38%',
        width: 0, height: 0,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent',
        borderRight: '14px solid #fff8e1',
        filter: 'drop-shadow(-2px 1px 1px rgba(0,0,0,0.3))',
    },
    details: {
        padding: '0 clamp(16px, 2.5vw, 24px) clamp(12px, 2vw, 18px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0',
        borderBottom: '1px dashed rgba(212,175,55,0.18)',
        fontSize: 'clamp(12px, 1.4vw, 14px)',
    },
    detailLabel: {
        color: 'var(--text-muted, #8a8a8a)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontSize: 'clamp(10px, 1.2vw, 12px)',
    },
    detailValue: {
        color: 'var(--text-primary, #f0f0f0)',
        textAlign: 'right',
    },
    warningBox: {
        marginTop: '10px',
        background: 'rgba(244,67,54,0.10)',
        border: '1px solid rgba(244,67,54,0.35)',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: 'clamp(11px, 1.3vw, 13px)',
        color: '#ef9a9a',
        lineHeight: 1.4,
    },
    error: {
        margin: '0 clamp(16px, 2.5vw, 24px)',
        color: '#ff6b6b',
        fontSize: '13px',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        padding: 'clamp(12px, 2vw, 18px) clamp(16px, 2.5vw, 24px)',
        background: 'rgba(0,0,0,0.25)',
    },
    btn: {
        flex: 1,
        padding: 'clamp(10px, 1.4vw, 13px)',
        borderRadius: '8px',
        fontSize: 'clamp(13px, 1.5vw, 15px)',
        fontWeight: 700,
        cursor: 'pointer',
        border: 'none',
        transition: 'transform 0.1s ease, filter 0.15s ease',
    },
    btnReject: {
        background: 'transparent',
        color: '#cfcfcf',
        border: '1px solid rgba(255,255,255,0.2)',
    },
    btnAccept: {
        background: 'linear-gradient(180deg, #b8860b 0%, #8b6508 100%)',
        color: '#fff8dc',
        border: '1px solid #d4af37',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
    },
};
