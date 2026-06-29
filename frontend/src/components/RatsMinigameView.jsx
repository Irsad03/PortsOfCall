import { useEffect, useRef, useState, useCallback } from 'react';
import { FocusTrap } from './FocusTrap';

const CW = 1280;
const CH = 720;

const GAME_DURATION_MS = 15_000;
const SCORE_THRESHOLD = 12;
const SPAWN_INTERVAL_MS = 600;
const RAT_LIFETIME_MS = 1200;
const RAT_RADIUS = 40;

const FIELD = { x: 80, y: 130, w: CW - 160, h: CH - 220 };

function randomSpawn(now) {
    return {
        x: FIELD.x + Math.random() * FIELD.w,
        y: FIELD.y + Math.random() * FIELD.h,
        bornAt: now,
        hit: false,
    };
}

function randomFreeLabel(rats) {
    const used = new Set(rats.filter(r => !r.hit).map(r => r.label));
    const free = [];
    for (let n = 1; n <= 9; n++) {
        const d = String(n);
        if (!used.has(d)) free.push(d);
    }
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
}

function drawCrate(ctx, x, y, w, h) {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#3a2718';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
}

function drawRat(ctx, cx, cy, ageFrac, label) {
    const a = Math.max(0, Math.min(1, ageFrac));
    const scale = a < 0.15
        ? a / 0.15
        : a > 0.85
            ? (1 - a) / 0.15
            : 1;
    const r = Math.max(0.01, RAT_RADIUS * scale);

    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + r * 0.65, cy - r * 0.1, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7a5a5a';
    ctx.beginPath();
    ctx.arc(cx + r * 0.55, cy - r * 0.45, r * 0.18, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.85, cy - r * 0.45, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff3a3a';
    ctx.beginPath();
    ctx.arc(cx + r * 0.85, cy - r * 0.15, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb0b0';
    ctx.beginPath();
    ctx.arc(cx + r * 1.05, cy - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7a5a5a';
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy);
    ctx.quadraticCurveTo(cx - r * 1.4, cy + r * 0.6, cx - r * 1.6, cy - r * 0.2);
    ctx.stroke();

    if (label != null) {
        ctx.save();
        ctx.font = `bold ${Math.round(r * 0.95)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(3, r * 0.16);
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.fillStyle = '#f2f2f2';
        ctx.strokeText(label, cx, cy);
        ctx.fillText(label, cx, cy);
        ctx.restore();
    }
}

export default function RatsMinigameView({ onFinish }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);
    const [outcome, setOutcome] = useState(null);
    const stateRef = useRef({
        rats: [],
        startedAt: 0,
        lastSpawn: 0,
        score: 0,
        done: false,
        animId: null,
    });

    const finish = useCallback((kind) => {
        const s = stateRef.current;
        if (s.done) return;
        s.done = true;
        setOutcome(kind);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        s.rats = [];
        s.startedAt = performance.now();
        s.lastSpawn = s.startedAt;
        s.score = 0;
        s.done = false;

        function loop(now) {
            if (s.done) {
                render(now);
                return;
            }

            const elapsed = now - s.startedAt;
            const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
            setRemainingMs(remaining);

            if (now - s.lastSpawn >= SPAWN_INTERVAL_MS) {
                s.lastSpawn = now;
                const rat = randomSpawn(now);
                rat.label = randomFreeLabel(s.rats);
                s.rats.push(rat);
            }

            s.rats = s.rats.filter(r => !r.hit && (now - r.bornAt) < RAT_LIFETIME_MS);

            render(now);

            if (remaining <= 0) {
                finish(s.score >= SCORE_THRESHOLD ? 'success' : 'fail');
                return;
            }

            s.animId = requestAnimationFrame(loop);
        }

        function render(now) {
            ctx.fillStyle = '#1a0f08';
            ctx.fillRect(0, 0, CW, CH);

            const plankGrad = ctx.createLinearGradient(0, 0, 0, CH);
            plankGrad.addColorStop(0, '#3a2412');
            plankGrad.addColorStop(1, '#241408');
            ctx.fillStyle = plankGrad;
            ctx.fillRect(0, 0, CW, CH);

            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1.5;
            for (let y = 60; y < CH; y += 80) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(CW, y);
                ctx.stroke();
            }

            drawCrate(ctx, 40, 80, 70, 70);
            drawCrate(ctx, CW - 110, 80, 70, 70);
            drawCrate(ctx, 40, CH - 160, 70, 70);
            drawCrate(ctx, CW - 110, CH - 160, 70, 70);
            drawCrate(ctx, CW / 2 - 35, CH - 90, 70, 70);

            for (const r of s.rats) {
                const age = (now - r.bornAt) / RAT_LIFETIME_MS;
                drawRat(ctx, r.x, r.y, age, r.label);
            }
        }

        function handleClick(ev) {
            if (s.done) return;
            const rect = canvas.getBoundingClientRect();
            const px = ((ev.clientX - rect.left) / rect.width) * CW;
            const py = ((ev.clientY - rect.top) / rect.height) * CH;

            for (let i = s.rats.length - 1; i >= 0; i--) {
                const r = s.rats[i];
                if (r.hit) continue;
                const dx = r.x - px;
                const dy = r.y - py;
                if (dx * dx + dy * dy <= RAT_RADIUS * RAT_RADIUS) {
                    r.hit = true;
                    s.score += 1;
                    setScore(s.score);
                    return;
                }
            }
        }

        function handleKey(ev) {
            if (s.done) return;
            if (!/^[1-9]$/.test(ev.key)) return;
            for (let i = s.rats.length - 1; i >= 0; i--) {
                const r = s.rats[i];
                if (r.hit || r.label !== ev.key) continue;
                r.hit = true;
                s.score += 1;
                setScore(s.score);
                return;
            }
        }

        canvas.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKey);
        s.animId = requestAnimationFrame(loop);

        return () => {
            s.done = true;
            if (s.animId) cancelAnimationFrame(s.animId);
            canvas.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKey);
        };
    }, [finish]);

    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const timerColor = seconds <= 5 ? '#ff7676' : '#9bd4ff';

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: '#000',
            display: 'flex', flexDirection: 'column', zIndex: 2500,
        }}>
            <div style={{
                flex: '0 0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: 'rgba(0,0,0,0.85)',
                color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>
                        Rats on board — exterminate {SCORE_THRESHOLD}!
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                        Press the number on each rat — or click them
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <span style={{ color: '#ffe0a0', fontWeight: 600 }}>
                        Score {score} / {SCORE_THRESHOLD}
                    </span>
                    <span style={{ color: timerColor, fontWeight: 700, minWidth: '52px', textAlign: 'right' }}>
                        ⏱ {seconds}s
                    </span>
                    {!outcome && (
                        <button
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => finish(stateRef.current.score >= SCORE_THRESHOLD ? 'success' : 'fail')}
                        >
                            Give up
                        </button>
                    )}
                </div>
            </div>

            <div style={{
                flex: '1 1 auto', minHeight: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
            }}>
                <canvas
                    ref={canvasRef}
                    width={CW}
                    height={CH}
                    style={{
                        width: 'auto', height: 'auto',
                        maxWidth: '100%', maxHeight: '100%',
                        aspectRatio: '16 / 9',
                        display: 'block', background: '#000', cursor: 'crosshair',
                    }}
                />
            </div>

            {outcome && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20,
                }}>
                    <FocusTrap style={{
                        backgroundColor: '#1a1f2e',
                        border: outcome === 'success'
                            ? '2px solid rgba(80,230,110,0.45)'
                            : '2px solid rgba(255,90,90,0.45)',
                        borderRadius: '12px',
                        padding: '28px 32px',
                        maxWidth: '440px', width: '90%', textAlign: 'center',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                    }}>
                        <h2 style={{
                            margin: '0 0 10px',
                            color: outcome === 'success' ? '#7be39a' : '#ff7676',
                            fontSize: '28px',
                        }}>
                            {outcome === 'success' ? 'Rats eliminated!' : 'The rats got away!'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 18px' }}>
                            {outcome === 'success'
                                ? `You scored ${score} hits and saved the cargo.`
                                : `Only ${score} hits — the rats damaged a chunk of your cargo before escaping.`}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => onFinish(outcome === 'success', score)}
                            style={{ width: '100%', fontSize: '15px', padding: '10px' }}
                            autoFocus
                        >
                            Continue
                        </button>
                    </FocusTrap>
                </div>
            )}

        </div>
    );
}
