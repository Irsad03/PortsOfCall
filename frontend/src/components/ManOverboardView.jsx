import { useEffect, useRef, useCallback, useState } from 'react';
import { FocusTrap } from './FocusTrap';
import mapSrc        from '../assets/minigame/stone-dodge/level1.jpg';
import rescueBoatSrc from '../assets/minigame/man-overobard/rescue-boat.png';

import manOverboardSrc from '../assets/minigame/man-overobard/man overboard.png';
import {
    buildSailorSprite,
    stepSailor, drawSailor,
    drawRipples, drawSplashes,
} from './drowningSailor';

const CW = 1280;
const CH = 720;

const BW = 110;
const BH = 60;
const HIT_W = BW * 0.68;
const HIT_H = BH * 0.55;

const FWD_SPEED = 220;
const REV_SPEED = 130;
const ACCEL     = 240;
const FRICTION  = 95;
const BRAKE     = 240;
const TURN_RATE = 2.7;
const IDLE_TURN = 0.65;

const SPAWN_HINT_X = 120;
const SPAWN_HINT_Y = CH / 2;
const START_A      = 0;

const SAILOR_HINT_X = CW * 0.78;
const SAILOR_HINT_Y = CH * 0.52;
const SAILOR_DRAW_W   = 80;
const SAILOR_DRAW_H   = 58;
const SAILOR_HIT_RADIUS = 42;

const SAILOR_SPRITE_OFFSET_X = -6;
const SAILOR_SPRITE_OFFSET_Y =  0;

const TIME_LIMIT_MS = 30_000;

function classifyPixel(r, g, b) {
    if (b > 80 && b > r + 10 && b > g - 15) return 'water';
    return 'obstacle';
}

function pixelKindAt(offCtx, mapW, mapH, px, py) {
    const ix = Math.round((px / CW) * mapW);
    const iy = Math.round((py / CH) * mapH);
    if (ix < 0 || iy < 0 || ix >= mapW || iy >= mapH) return 'obstacle';
    const d = offCtx.getImageData(ix, iy, 1, 1).data;
    return classifyPixel(d[0], d[1], d[2]);
}

function boatCollides(offCtx, mapW, mapH, cx, cy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw  = HIT_W / 2;
    const hh  = HIT_H / 2;
    for (let i = -2; i <= 2; i += 1) {
        for (let j = -1; j <= 1; j += 1) {
            const lx = (i / 2) * hw;
            const ly = j * hh;
            const wx = cx + lx * cos - ly * sin;
            const wy = cy + lx * sin + ly * cos;
            if (pixelKindAt(offCtx, mapW, mapH, wx, wy) === 'obstacle') return true;
        }
    }
    return false;
}

function findSafeSpot(offCtx, mapW, mapH, hintX, hintY) {
    const testAngles = [
        START_A,
        START_A + Math.PI / 6, START_A - Math.PI / 6,
        START_A + Math.PI / 3, START_A - Math.PI / 3,
    ];
    for (let r = 0; r <= 380; r += 6) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
            const x = hintX + Math.cos(a) * r;
            const y = hintY + Math.sin(a) * r;
            let ok = true;
            for (const ang of testAngles) {
                if (boatCollides(offCtx, mapW, mapH, x, y, ang)) { ok = false; break; }
            }
            if (ok) return [x, y];
        }
    }
    return [hintX, hintY];
}

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawWake(ctx, x, y, angle, speed, t) {
    const speedAbs = Math.abs(speed);
    if (speedAbs < 5) return;
    const sternDir = speed > 0 ? -1 : 1;
    const intensity = Math.min(1, speedAbs / FWD_SPEED);
    for (let i = 1; i <= 4; i += 1) {
        const d = sternDir * (BW / 2 + 6 + i * 11 + (t * 60) % 6);
        const wx = x + Math.cos(angle) * d;
        const wy = y + Math.sin(angle) * d;
        ctx.fillStyle = `rgba(255,255,255,${(0.45 - i * 0.09) * intensity})`;
        ctx.beginPath();
        ctx.arc(wx, wy, (5 - i) + intensity, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRescueBoatFallback(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,20,0.35)';
    ctx.beginPath();
    ctx.ellipse(4, 6, w / 2 + 2, h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    hullGrad.addColorStop(0,   '#ffa64d');
    hullGrad.addColorStop(0.5, '#ff7a1a');
    hullGrad.addColorStop(1,   '#b84500');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, -h / 2 + 4);
    ctx.lineTo( w / 2 - 12, -h / 2 + 2);
    ctx.quadraticCurveTo(w / 2 + 4, 0,  w / 2 - 12,  h / 2 - 2);
    ctx.lineTo(-w / 2 + 4,  h / 2 - 4);
    ctx.quadraticCurveTo(-w / 2 - 2, 0, -w / 2 + 4, -h / 2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a1500';
    ctx.lineWidth   = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#d62b1f';
    ctx.fillRect(-2, -h / 2 + 10, 4, h - 20);
    ctx.fillRect(-h / 2 + 10, -2, h - 20, 4);
}

export default function ManOverboardView({ onExit }) {
    const canvasRef = useRef(null);
    const [outcome, setOutcome]  = useState(null);
    const [, forceRender]        = useState(0);

    const stateRef = useRef({
        x: SPAWN_HINT_X, y: SPAWN_HINT_Y, angle: START_A, speed: 0,
        startTime: 0,
        mapImg: null,
        offCtx: null,
        mapW: 1, mapH: 1,
        sailorPos: { x: SAILOR_HINT_X, y: SAILOR_HINT_Y },
        sailorSprite: null,
        sailorAnim: { t0: 0, splashes: [], ripples: [], splashAcc: 0, rippleAcc: 0 },
        boatImg: null,
        boatImgFailed: false,
        keys: new Set(),
        started: false,
        done: false,
        crashFlash: 0,
        wakeT: 0,
        lastTime: 0,
        animId: null,
    });

    const handleKey = useCallback((e, down) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const s = stateRef.current;
        if (down) {
            s.keys.add(e.key);
            if (!s.started) {
                s.started = true;
                s.startTime = performance.now();
                s.lastFrameAdvance = s.startTime;
            }
        } else {
            s.keys.delete(e.key);
        }
    }, []);

    const finish = useCallback((kind, rescueTimeMs) => {
        const s = stateRef.current;
        s.done = true;
        setOutcome({ kind, rescueTimeMs });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        s.x = SPAWN_HINT_X; s.y = SPAWN_HINT_Y; s.angle = START_A;
        s.speed = 0;
        s.keys = new Set();
        s.started = false; s.done = false;
        s.startTime = 0;
        s.crashFlash = 0; s.wakeT = 0;
        s.frameIndex = 0;

        canvas.focus();

        const onKeyDown = e => handleKey(e, true);
        const onKeyUp   = e => handleKey(e, false);

        ctx.fillStyle = '#0b1220';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#7fbfff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading rescue scene …', CW / 2, CH / 2);

        const mapImg = new Image();
        mapImg.onload = () => {
            s.mapImg = mapImg;
            s.mapW   = mapImg.naturalWidth;
            s.mapH   = mapImg.naturalHeight;

            const off = document.createElement('canvas');
            off.width  = s.mapW;
            off.height = s.mapH;
            const offCtx = off.getContext('2d', { willReadFrequently: true });
            offCtx.drawImage(mapImg, 0, 0);
            s.offCtx = offCtx;

            const [spawnX, spawnY] = findSafeSpot(offCtx, s.mapW, s.mapH, SPAWN_HINT_X, SPAWN_HINT_Y);
            s.x = spawnX; s.y = spawnY;

            const [sailorX, sailorY] = findSafeSpot(offCtx, s.mapW, s.mapH, SAILOR_HINT_X, SAILOR_HINT_Y);
            s.sailorPos = { x: sailorX, y: sailorY };

            const sailorImg = new Image();
            sailorImg.onload = () => {
                s.sailorSprite     = buildSailorSprite(sailorImg);
                s.sailorAnim.t0    = performance.now() / 1000;
            };
            sailorImg.src = manOverboardSrc;

            const boatImg = new Image();
            boatImg.onload  = () => { s.boatImg = boatImg; };
            boatImg.onerror = () => { s.boatImgFailed = true; };
            boatImg.src     = rescueBoatSrc;

            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup',   onKeyUp);
            s.lastTime = performance.now();
            s.lastFrameAdvance = s.lastTime;
            s.animId  = requestAnimationFrame(loop);
        };
        mapImg.onerror = () => console.error('ManOverboardView: map image failed to load');
        mapImg.src = mapSrc;

        function loop(now) {
            if (s.done) {
                render();
                if (s.crashFlash > 0) {
                    s.animId = requestAnimationFrame(loop);
                }
                return;
            }

            const dt = Math.min((now - s.lastTime) / 1000, 0.05);
            s.lastTime = now;

            stepSailor(s.sailorAnim, now / 1000, dt, 'struggle', 1);

            if (s.started) forceRender(v => (v + 1) % 1_000_000);

            let turn = 0;
            if (s.keys.has('ArrowLeft'))  turn -= 1;
            if (s.keys.has('ArrowRight')) turn += 1;
            let thrust = 0;
            if (s.keys.has('ArrowUp'))   thrust = +1;
            if (s.keys.has('ArrowDown')) thrust = -1;

            if (thrust > 0) {
                if (s.speed < 0) s.speed = Math.min(0, s.speed + (ACCEL + BRAKE) * dt);
                else             s.speed = Math.min(FWD_SPEED, s.speed + ACCEL * dt);
            } else if (thrust < 0) {
                if (s.speed > 0) s.speed = Math.max(0, s.speed - (ACCEL + BRAKE) * dt);
                else             s.speed = Math.max(-REV_SPEED, s.speed - ACCEL * dt);
            } else {
                if (s.speed > 0) s.speed = Math.max(0, s.speed - FRICTION * dt);
                else if (s.speed < 0) s.speed = Math.min(0, s.speed + FRICTION * dt);
            }

            const speedFrac = Math.min(1, Math.abs(s.speed) / FWD_SPEED);
            const turnRate  = TURN_RATE * (IDLE_TURN + (1 - IDLE_TURN) * speedFrac);
            if (turn !== 0) {
                const dir = s.speed < -1 ? -1 : 1;
                const newAngle = s.angle + turn * dir * turnRate * dt;
                if (!boatCollides(s.offCtx, s.mapW, s.mapH, s.x, s.y, newAngle)) {
                    s.angle = newAngle;
                }
            }

            const vx = Math.cos(s.angle) * s.speed;
            const vy = Math.sin(s.angle) * s.speed;
            const nx = s.x + vx * dt;
            const ny = s.y + vy * dt;

            if (s.started) {
                const dxs = nx - s.sailorPos.x;
                const dys = ny - s.sailorPos.y;
                if (dxs * dxs + dys * dys < SAILOR_HIT_RADIUS * SAILOR_HIT_RADIUS) {
                    s.x = nx; s.y = ny;
                    s.speed = 0;
                    render();
                    finish('success', Math.round(now - s.startTime));
                    return;
                }
            }

            if (s.started && Math.abs(s.speed) > 0.5) {
                const oob = nx < HIT_W / 2 || nx > CW - HIT_W / 2
                         || ny < HIT_H / 2 || ny > CH - HIT_H / 2;
                const crashed = oob || boatCollides(s.offCtx, s.mapW, s.mapH, nx, ny, s.angle);
                if (crashed) {
                    s.crashFlash = 1;
                    render();
                    finish('crash', Math.round(now - s.startTime));
                    return;
                }
            }

            if (s.started && (now - s.startTime) >= TIME_LIMIT_MS) {
                render();
                finish('fail', TIME_LIMIT_MS);
                return;
            }

            if (Math.abs(s.speed) > 1) s.wakeT += dt * 6;

            s.x = nx;
            s.y = ny;
            render();
            s.animId = requestAnimationFrame(loop);
        }

        function render() {
            if (s.mapImg) {
                ctx.drawImage(s.mapImg, 0, 0, CW, CH);
            } else {
                ctx.fillStyle = '#0b3a5a';
                ctx.fillRect(0, 0, CW, CH);
            }

            if (s.sailorSprite) {
                drawRipples(ctx, s.sailorAnim, s.sailorPos);
                drawSailor(ctx,  s.sailorAnim, s.sailorSprite, s.sailorPos);
                drawSplashes(ctx, s.sailorAnim);
            }

            const tSec = performance.now() / 1000;
            drawWake(ctx, s.x, s.y, s.angle, s.speed, tSec);

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            if (s.boatImg && !s.boatImgFailed) {
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(s.boatImg, -BH / 2, -BW / 2, BH, BW);
            } else {
                drawRescueBoatFallback(ctx, BW, BH);
            }
            ctx.restore();

            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, CW, 56);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🆘  Man Overboard — Dodge the rocks, reach the sailor!', CW / 2, 36);

            const elapsed = s.started ? performance.now() - s.startTime : 0;
            const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
            const secs = Math.ceil(remaining / 1000);
            const danger = remaining < 8_000;

            const pillW = 130, pillH = 40, pillX = CW - pillW - 20, pillY = 8;
            ctx.fillStyle = danger ? 'rgba(150, 30, 30, 0.85)' : 'rgba(20, 60, 100, 0.85)';
            roundRectPath(ctx, pillX, pillY, pillW, pillH, 8);
            ctx.fill();
            ctx.strokeStyle = danger ? '#ff7676' : '#7fbfff';
            ctx.lineWidth   = 2;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(`⏱  ${secs}s`, pillX + pillW / 2, pillY + 28);

            if (!s.started && !s.done) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, CH - 110, CW, 110);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('↑ Throttle    ↓ Reverse    ← Turn left    → Turn right', CW / 2, CH - 65);
                ctx.font = '17px sans-serif';
                ctx.fillStyle = '#cfe6ff';
                ctx.fillText('Reach the drowning sailor before the timer — and don\'t hit the rocks!', CW / 2, CH - 32);
            }

            if (s.crashFlash > 0) {
                ctx.fillStyle = `rgba(255, 60, 60, ${0.45 * s.crashFlash})`;
                ctx.fillRect(0, 0, CW, CH);
                s.crashFlash = Math.max(0, s.crashFlash - 0.04);
            }
        }

        return () => {
            s.done = true;
            if (s.animId) cancelAnimationFrame(s.animId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup',   onKeyUp);
        };
    }, [handleKey, finish]);

    const outcomeMeta = outcome && (() => {
        switch (outcome.kind) {
            case 'success':
                return {
                    title:  'Crew Rescued!',
                    blurb:  `You pulled the sailor back aboard in ${(outcome.rescueTimeMs / 1000).toFixed(1)} s. Voyage continues unharmed.`,
                    color:  '#7be39a',
                    border: '2px solid rgba(80,230,110,0.45)',
                };
            case 'crash':
                return {
                    title:  'Crashed on the Rocks!',
                    blurb:  'You ploughed straight into a rock formation. The rescue boat is wrecked and the sailor was lost — your ship took damage from the chaos.',
                    color:  '#ff7676',
                    border: '2px solid rgba(255,90,90,0.45)',
                };
            default:
                return {
                    title:  'Lost at Sea',
                    blurb:  'The sailor slipped beneath the waves before you could reach him. Your crew\'s morale is shaken — the ship took some damage.',
                    color:  '#ff7676',
                    border: '2px solid rgba(255,90,90,0.45)',
                };
        }
    })();

    return (
        <div style={{
            position:        'fixed',
            inset:           0,
            backgroundColor: '#000',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            zIndex:          2500,
            overflow:        'hidden',
        }}>
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                tabIndex={0}
                onClick={e => e.currentTarget.focus()}
                style={{
                    width:      'max(100%, calc(100vh * 16 / 9))',
                    height:     'max(100%, calc(100vw * 9 / 16))',
                    display:    'block',
                    outline:    'none',
                    cursor:     'crosshair',
                    background: '#000',
                }}
            />

            {!outcome && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                    <button
                        className="btn btn-danger"
                        onClick={() => onExit?.({ success: false, rescueTimeMs: 0 })}
                    >
                        Abort Rescue
                    </button>
                </div>
            )}

            {outcome && outcomeMeta && (
                <div style={{
                    position:        'absolute',
                    inset:           0,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex:          20,
                }}>
                    <FocusTrap style={{
                        backgroundColor: '#1a1f2e',
                        border:          outcomeMeta.border,
                        borderRadius:    '12px',
                        padding:         '28px 32px',
                        maxWidth:        '460px',
                        width:           '90%',
                        textAlign:       'center',
                        boxShadow:       '0 12px 40px rgba(0,0,0,0.8)',
                    }}>
                        <h2 style={{
                            margin:    '14px 0 10px',
                            color:     outcomeMeta.color,
                            fontSize:  '26px',
                        }}>
                            {outcomeMeta.title}
                        </h2>
                        <p style={{ color: 'var(--color-text-muted, #aab1bd)', fontSize: '14px', margin: '0 0 18px' }}>
                            {outcomeMeta.blurb}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => onExit?.({
                                success:      outcome.kind === 'success',
                                rescueTimeMs: outcome.rescueTimeMs,
                            })}
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
