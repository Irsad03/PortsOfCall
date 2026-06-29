import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';
import { FocusTrap } from './FocusTrap';

import brokerBackground from '../assets/broker/Shipbroker-background.jpg';
import highEndShipImg   from '../assets/ships/high-level/High-end-Ship.png';
import normalShipImg    from '../assets/ships/mid-range/mid-range-ship.png';
import lowBudgetShipImg from '../assets/ships/low-end/low-end-ship2.png';
import lowVariantImg    from '../assets/ships/low-end/low-end-ship.png';
import middleVariantImg from '../assets/ships/mid-range/mid-range-ship2.png';
import highVariantImg   from '../assets/ships/high-level/High-end-Ship2.png';

const INTRO_FPS      = 35;
const IDLE_FPS       = 24;
const FIRST_FRAME    = 20;
const START_FRAME    = 30;
const REVEAL_FRAME   = 93;
const SKIP_FROM_FRAME = 95;
const SKIP_TO_FRAME   = 148;
const PING_LOW_FRAME = 157;
const PING_HIGH_FRAME = 224;

const FRAME_URLS = Object.entries(
    import.meta.glob('../assets/broker/new broker/*.jpg', {
        eager: true, query: '?url', import: 'default',
    }),
).sort((a, b) => a[0].localeCompare(b[0])).map(entry => entry[1]);

const SHIP_CLASS_INFO = {
    HIGH_TECH_SHIPS:   { label: 'High-End',     sprite: highEndShipImg },
    MEDIUM_COST_SHIPS: { label: 'Normal-Range', sprite: normalShipImg },
    LOW_COST_SHIPS:    { label: 'Low-Budget',   sprite: lowBudgetShipImg },
};

const SHIP_NAME_SPRITES = {
    'Coastal Runner':       lowVariantImg,
    'Stormrider Clipper':   middleVariantImg,
    'Crown Galleon':        highVariantImg,
    'Salt-Stained Runner':  lowVariantImg,
    'Storm-Worn Clipper':   middleVariantImg,
    'Tarnished Galleon':    highVariantImg,
};

function shipClassInfo(ship) {
    const shipClass = typeof ship === 'string' ? ship : ship?.shipClass;
    const base = SHIP_CLASS_INFO[shipClass] ?? { label: shipClass ?? '—', sprite: normalShipImg };
    const nameOverride = typeof ship === 'object' && ship?.name
        ? SHIP_NAME_SPRITES[ship.name]
        : undefined;
    return nameOverride ? { ...base, sprite: nameOverride } : base;
}

function measureViewport() {
    const w = typeof window !== 'undefined' ? window.innerWidth  : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
        isCompact: w < 900,
        isNarrow:  w < 600,
        isShort:   h < 560,
    };
}

function MiniHealthBar({ value }) {
    const color = value >= 60 ? '#4caf50' : value >= 20 ? '#ff9800' : '#f44336';
    return (
        <div style={{
            background: '#2a2a2a', borderRadius: '3px', height: '6px',
            width: '100%', overflow: 'hidden',
        }}>
            <div style={{ width: `${value}%`, height: '100%', background: color }} />
        </div>
    );
}

function ShipNamingModal({ ship, onConfirm, onCancel, closing }) {
    const [name, setName]       = useState('');
    const [visible, setVisible] = useState(false);
    const inputRef              = useRef(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (ship) {
            setTimeout(() => {
                setName(ship.name ?? '');
                inputRef.current?.select();
            }, 80);
        }
    }, [ship?.id, ship?.name]);

    const isShowing = visible && !closing;

    function handleKeyDown(e) {
        if (e.key === 'Enter')  onConfirm(name.trim());
        // Esc intentionally does not cancel — closing is via the buttons only.
    }

    if (!ship) return null;

    const shipClassLabel = shipClassInfo(ship).label;

    return (
        <div
            onClick={onCancel}
            style={{
                position:       'fixed',
                inset:          0,
                zIndex:         1000,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '1rem',
                background:     `rgba(4, 9, 15, ${isShowing ? 0.72 : 0})`,
                backdropFilter: isShowing ? 'blur(3px)' : 'blur(0px)',
                transition:     'background 0.25s ease, backdrop-filter 0.25s ease',
            }}
        >
            <FocusTrap
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                style={{
                    background:   'var(--surface-hull)',
                    border:       '1px solid rgba(40, 120, 208, 0.35)',
                    borderRadius: '12px',
                    padding:      '28px 28px 24px',
                    width:        '100%',
                    maxWidth:     '400px',
                    boxShadow:    '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(40,120,208,0.12)',
                    opacity:   isShowing ? 1 : 0,
                    transform: isShowing ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
                    transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Name your new ship
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-bright)' }}>
                        {ship.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {shipClassLabel}
                        {ship.capacity ? ` · ${ship.capacity}t` : ''}
                        {ship.used ? ` · Hull: ${ship.healthPoints}%` : ''}
                        {' · '}
                        <span style={{ color: 'var(--color-gold)' }}>{ship.price?.toLocaleString()}🪙</span>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                    }}>
                        Ship Name
                    </label>
                    <input
                        ref={inputRef}
                        className="form-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter a name…"
                        maxLength={40}
                        style={{ width: '100%', fontSize: '14px' }}
                        autoFocus
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                        {name.trim().length}/40
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onConfirm(name.trim())}
                        disabled={!name.trim()}
                        style={{ flex: 2 }}
                    >
                        Buy
                    </button>
                </div>
            </FocusTrap>
        </div>
    );
}

export default function BrokerView({ myPlayerId, onBack }) {
    const {updatePlayerState, refreshMyBalance, players} = useGame();
    const [marketShips, setMarketShips] = useState([]);
    const [loading, setLoading]         = useState(false);
    const [apiError, setApiError]       = useState(null);

    const [tab, setTab]       = useState('new');
    const [index, setIndex]   = useState(0);

    const [modalShip,    setModalShip]    = useState(null);
    const [modalClosing, setModalClosing] = useState(false);

    const canvasRef               = useRef(null);
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || FRAME_URLS.length === 0) return;
        const ctx = canvas.getContext('2d');

        const images = FRAME_URLS.map(url => { const img = new Image(); img.src = url; return img; });

        const lastIdx  = images.length - 1;
        const clamp    = i => Math.max(0, Math.min(lastIdx, i));
        const startIdx  = clamp(START_FRAME     - FIRST_FRAME);
        const pingLow   = clamp(PING_LOW_FRAME  - FIRST_FRAME);
        const pingHigh  = clamp(PING_HIGH_FRAME - FIRST_FRAME);
        const revealIdx = clamp(REVEAL_FRAME    - FIRST_FRAME);
        const skipFrom  = clamp(SKIP_FROM_FRAME - FIRST_FRAME);
        const skipTo    = clamp(SKIP_TO_FRAME   - FIRST_FRAME);
        const introDur  = 1000 / INTRO_FPS;
        const idleDur   = 1000 / IDLE_FPS;

        let current      = startIdx;
        let phase        = 'intro';
        let dir          = 1;
        let revealedOnce = false;
        let last         = performance.now();
        let rafId        = 0;

        function draw(i) {
            const img = images[i];
            if (img && img.complete && img.naturalWidth) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
        }

        function step() {
            if (phase === 'intro') {
                current++;
                if (current === skipFrom) current = skipTo;
                if (current >= lastIdx) {
                    current = lastIdx;
                    phase = 'pingpong';
                    dir = -1;
                }
                return;
            }
            current += dir;
            if (current >= pingHigh) { current = pingHigh; dir = -1; }
            else if (current <= pingLow) { current = pingLow; dir = 1; }
        }

        function tick(now) {
            const frameDur = phase === 'intro' ? introDur : idleDur;
            const elapsed = now - last;
            if (elapsed >= frameDur) {
                const steps = Math.floor(elapsed / frameDur);
                last += steps * frameDur;
                for (let s = 0; s < steps; s++) step();
                if (!revealedOnce && current >= revealIdx) {
                    revealedOnce = true;
                    setRevealed(true);
                }
                draw(current);
            }
            rafId = requestAnimationFrame(tick);
        }

        if (images[startIdx].complete) draw(startIdx);
        else images[startIdx].onload = () => draw(startIdx);

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const [viewport, setViewport] = useState(() => measureViewport());
    useEffect(() => {
        function onResize() { setViewport(measureViewport()); }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const { isCompact, isNarrow, isShort } = viewport;

    useEffect(() => {
        loadShips();
    }, []);

    async function loadShips() {
        setLoading(true);
        try {
            setMarketShips(await gameService.getMarketShips());
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const ships = useMemo(
        () => marketShips.filter(s => (tab === 'used' ? s.used : !s.used)),
        [marketShips, tab],
    );

    useEffect(() => { setIndex(0); }, [tab, ships.length]);

    const currentShip = ships[index] ?? null;
    const total       = ships.length;

    const goPrev = useCallback(
        () => setIndex(i => (total === 0 ? 0 : (i - 1 + total) % total)),
        [total],
    );
    const goNext = useCallback(
        () => setIndex(i => (total === 0 ? 0 : (i + 1) % total)),
        [total],
    );

    useEffect(() => {
        if (modalShip) return;
        function onKey(e) {
            if (e.key === 'ArrowLeft')  goPrev();
            if (e.key === 'ArrowRight') goNext();
            // Esc intentionally does not close the broker — use the back button.
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext, modalShip]);

    function openModal(ship) {
        setModalClosing(false);
        setModalShip(ship);
    }

    function closeModal() {
        setModalClosing(true);
        setTimeout(() => {
            setModalShip(null);
            setModalClosing(false);
        }, 240);
    }

    async function handleConfirmBuy(customName) {
        if (!customName || !modalShip) return;

        setLoading(true);
        setApiError(null);
        const ship = modalShip;
        closeModal();

        try {
            await gameService.buyShip(myPlayerId, ship.id, customName);
            const myPlayer = players.find(p => p.playerId === myPlayerId);
            if (myPlayer) {
                updatePlayerState(myPlayerId, {
                    money: myPlayer.money - ship.price,
                });
            }
            await refreshMyBalance(myPlayerId);
            onBack();
        } catch (err) {
            setApiError(err.message);
            setLoading(false);
        }
    }

    const info       = currentShip ? shipClassInfo(currentShip) : null;
    const newCount   = marketShips.filter(s => !s.used).length;
    const usedCount  = marketShips.filter(s =>  s.used).length;

    return createPortal(
        <>
            <FocusTrap
                style={{
                    position:   'fixed',
                    inset:      0,
                    zIndex:     900,
                    overflow:   'hidden',
                    background: '#0a1525',
                }}
            >
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `url(${brokerBackground}) center/cover no-repeat`,
                    filter: 'saturate(1.15) brightness(0.97) contrast(1.03)',
                    zIndex: 0,
                }} />

                <canvas
                    ref={canvasRef}
                    width={1920}
                    height={1080}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'saturate(1.15) brightness(0.97) contrast(1.03)',
                        zIndex: 0,
                    }}
                />

                <div style={{
                    position: 'absolute', inset: 0,
                    background:
                        'radial-gradient(ellipse 70% 60% at 50% 45%, ' +
                        'rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 60%, rgba(4,9,21,0.78) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }} />

                <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '8%',
                    transform: 'translateX(-50%)',
                    width: '70%',
                    height: '55%',
                    background:
                        'radial-gradient(ellipse at center, ' +
                        'rgba(255, 220, 140, 0.22) 0%, ' +
                        'rgba(255, 200, 100, 0.10) 40%, ' +
                        'rgba(0,0,0,0) 70%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                    filter: 'blur(2px)',
                }} />
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'linear-gradient(to bottom, rgba(4,9,15,0.78), rgba(4,9,15,0))',
                    zIndex: 5,
                }}>
                    <button
                        onClick={onBack}
                        aria-label="Close Ship Broker"
                        title="Close"
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            border: '1px solid rgba(40,120,208,0.4)',
                            background: 'rgba(4,9,15,0.72)',
                            color: 'var(--text-bright, #fff)',
                            fontSize: '20px', fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            lineHeight: 1,
                            backdropFilter: 'blur(6px)',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                            transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.7)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,9,15,0.72)'; }}
                    >
                        ✕
                    </button>

                    {!isNarrow && (
                        <h3 style={{
                            margin: 0,
                            color: 'var(--text-bright)',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            fontSize: isCompact ? '14px' : '18px',
                            whiteSpace: 'nowrap',
                        }}>
                            Ship Broker
                        </h3>
                    )}

                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(4,9,15,0.65)',
                        border: '1px solid rgba(40,120,208,0.3)',
                        borderRadius: '8px',
                        padding: '3px',
                    }}>
                        <TabButton active={tab === 'new'}  onClick={() => setTab('new')}  label={`New (${newCount})`} />
                        <TabButton active={tab === 'used'} onClick={() => setTab('used')} label={`Used (${usedCount})`} />
                    </div>
                </div>

                {apiError && (
                    <div style={{
                        position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(180,40,40,0.85)', color: '#fff',
                        padding: '8px 16px', borderRadius: '6px', zIndex: 6, fontSize: '13px',
                    }}>
                        {apiError}
                    </div>
                )}

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                  {revealed && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                    {total > 1 && (
                        <ArrowButton direction="left"  onClick={goPrev} disabled={loading} isNarrow={isNarrow} />
                    )}

                    {currentShip ? (
                        <img
                            key={currentShip.id}
                            src={info.sprite}
                            alt={info.label}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: isCompact ? '28%' : '10%',
                                transform: 'translateX(-50%)',
                                width:     isNarrow ? '95%' : isCompact ? '88%' : '70%',
                                maxWidth:  '95%',
                                height:    'auto',
                                maxHeight: isShort  ? '60%' : '80%',
                                objectFit: 'contain',
                                imageRendering: 'pixelated',
                                filter:
                                    'drop-shadow(0 14px 18px rgba(0,0,0,0.55)) '
                                  + 'drop-shadow(0 0 28px rgba(255, 210, 120, 0.18))',
                                animation: 'shipBob 3.2s ease-in-out infinite',
                                pointerEvents: 'none',
                                zIndex: 2,
                            }}
                        />
                    ) : (
                        <div style={{
                            color: 'var(--text-bright)',
                            background: 'rgba(4,9,15,0.65)',
                            border: '1px solid rgba(40,120,208,0.3)',
                            padding: '14px 22px', borderRadius: '10px',
                            fontSize: '14px',
                        }}>
                            {loading ? 'Loading ships…' : (tab === 'used'
                                ? 'No used ships on the market.'
                                : 'No new ships on the market.')}
                        </div>
                    )}

                    {total > 1 && (
                        <ArrowButton direction="right" onClick={goNext} disabled={loading} isNarrow={isNarrow} />
                    )}
                    </div>
                  )}
                </div>

                {revealed && total > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: isCompact ? 'calc(22% + 8px)' : '22px',
                        left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '6px', zIndex: 4,
                    }}>
                        {ships.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                aria-label={`Ship ${i + 1}`}
                                style={{
                                    width: i === index ? '20px' : '8px',
                                    height: '8px', borderRadius: '4px',
                                    border: 'none', cursor: 'pointer',
                                    background: i === index
                                        ? 'var(--color-gold, #ffc857)'
                                        : 'rgba(255,255,255,0.45)',
                                    transition: 'width 0.2s ease, background 0.2s ease',
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                )}

                {revealed && currentShip && (
                    <StatsPanel
                        ship={currentShip}
                        onBuy={() => openModal(currentShip)}
                        loading={loading}
                        isCompact={isCompact}
                    />
                )}
            </FocusTrap>

            {modalShip && (
                <ShipNamingModal
                    ship={modalShip}
                    closing={modalClosing}
                    onConfirm={handleConfirmBuy}
                    onCancel={closeModal}
                />
            )}

            <style>{`
                @keyframes shipBob {
                    0%, 100% { transform: translate(-50%, 0); }
                    50%      { transform: translate(-50%, -6px); }
                }
            `}</style>
        </>,
        document.body,
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 14px',
                background: active ? 'rgba(40,120,208,0.85)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted, #b8c4d0)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
            }}
        >
            {label}
        </button>
    );
}

function ArrowButton({ direction, onClick, disabled, isNarrow }) {
    const isLeft = direction === 'left';
    const size   = isNarrow ? 40 : 52;
    const offset = isNarrow ? 10 : 24;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={isLeft ? 'Previous ship' : 'Next ship'}
            style={{
                position: 'absolute',
                [isLeft ? 'left' : 'right']: `${offset}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                border: '1px solid rgba(40,120,208,0.4)',
                background: 'rgba(4,9,15,0.72)',
                color: 'var(--text-bright, #fff)',
                fontSize: isNarrow ? '20px' : '24px',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                backdropFilter: 'blur(6px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                zIndex: 3,
                transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(40,120,208,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,9,15,0.72)'; }}
        >
            {isLeft ? '‹' : '›'}
        </button>
    );
}

function StatsPanel({ ship, onBuy, loading, isCompact }) {
    const info = shipClassInfo(ship);

    const speed      = ship.speed ? Math.round(ship.speed) : null;
    const fuelPer100 = ship.fuelPer100 || null;
    const range      = fuelPer100 ? Math.round(10000 / fuelPer100) : null;

    if (isCompact) {
        return (
            <div style={{
                position: 'absolute',
                left: 0, right: 0, bottom: 0,
                background: '#0a1322',
                borderTop: '1px solid rgba(40,120,208,0.4)',
                padding: '10px 14px',
                color: 'var(--text-bright, #e8eef5)',
                boxShadow: '0 -8px 24px rgba(0,0,0,0.6), 0 0 32px rgba(40,120,208,0.18)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
            }}>
                <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                    <div style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
                        textTransform: 'uppercase', color: 'var(--color-gold, #ffc857)',
                    }}>
                        {info.label}
                    </div>
                    <div style={{
                        fontSize: '14px', fontWeight: 700,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {ship.name || 'Unknown Model'}
                    </div>
                </div>

                <CompactStat label="Capacity" value={`${ship.capacity ?? 0} t`} />
                {speed != null && <CompactStat label="Speed" value={`${speed} kn`} />}
                {range != null && <CompactStat label="Range" value={`${range} nm`} />}
                {fuelPer100 != null && <CompactStat label="Fuel" value={`${fuelPer100} gal/100 nm`} />}
                {ship.used && <CompactStat label="Hull" value={`${ship.healthPoints}%`} />}
                <CompactStat
                    label="Price"
                    value={`${ship.price ? ship.price.toLocaleString() : 0}🪙`}
                    accent
                />

                <button
                    className="btn btn-primary"
                    onClick={onBuy}
                    disabled={loading}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    Buy
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: 'min(300px, calc(100% - 48px))',
            background: '#0a1322',
            border: '1px solid rgba(40,120,208,0.4)',
            borderRadius: '10px',
            padding: '18px 20px 16px',
            color: 'var(--text-bright, #e8eef5)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 32px rgba(40,120,208,0.18)',
            zIndex: 10,
        }}>
            <div style={{
                display: 'inline-block',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--color-gold, #ffc857)',
                marginBottom: '6px',
            }}>
                {info.label}
            </div>

            <div style={{
                fontSize: '17px',
                fontWeight: 700,
                marginBottom: '14px',
                lineHeight: 1.2,
            }}>
                {ship.name || 'Unknown Model'}
            </div>

            <StatRow label="Capacity" value={`${ship.capacity ?? 0} t`} />
            {speed != null && <StatRow label="Speed" value={`${speed} kn`} />}
            {range != null && <StatRow label="Range" value={`${range} nm`} />}
            {fuelPer100 != null && <StatRow label="Fuel use" value={`${fuelPer100} gal / 100 nm`} />}
            {ship.used && (
                <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted, #8a96a3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Hull
                        </span>
                        <span style={{ fontWeight: 600 }}>{ship.healthPoints}%</span>
                    </div>
                    <MiniHealthBar value={ship.healthPoints} />
                </div>
            )}

            <div style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
            }}>
                <span style={{
                    fontSize: '11px',
                    color: 'var(--text-muted, #8a96a3)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                }}>Price</span>
                <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--color-gold, #ffc857)',
                }}>
                    {ship.price ? ship.price.toLocaleString() : 0}🪙
                </span>
            </div>

            <button
                className="btn btn-primary"
                onClick={onBuy}
                disabled={loading}
                style={{ width: '100%', marginTop: '14px' }}
            >
                Buy
            </button>
        </div>
    );
}

function CompactStat({ label, value, accent }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
                fontSize: '9px', color: 'var(--text-muted, #8a96a3)',
                letterSpacing: '1px', textTransform: 'uppercase',
            }}>
                {label}
            </span>
            <span style={{
                fontSize: '13px', fontWeight: 700,
                color: accent ? 'var(--color-gold, #ffc857)' : 'var(--text-bright, #e8eef5)',
                whiteSpace: 'nowrap',
            }}>
                {value}
            </span>
        </div>
    );
}

function StatRow({ label, value }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            padding: '4px 0',
        }}>
            <span style={{
                color: 'var(--text-muted, #8a96a3)',
                letterSpacing: '0.5px',
                fontSize: '11px',
                textTransform: 'uppercase',
                alignSelf: 'center',
            }}>
                {label}
            </span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}
