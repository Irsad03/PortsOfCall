import { useEffect, useRef, useCallback, useState } from 'react';
import mapSrc from '../assets/minigame/parking/parkinggame.png';

const CW = 1280;
const CH = 720;

const SW = 130;
const SH = 30;

const HIT_W = SW * 0.74;
const HIT_H = SH * 0.55;

const FWD_SPEED = 150;
const REV_SPEED = 95;
const ACCEL     = 90;
const FRICTION  = 38;
const BRAKE     = 130;
const TURN_RATE = 2.0;
const IDLE_TURN = 0.55;

const SPAWN_HINT_X = 100;
const SPAWN_HINT_Y = 400;
const START_A      = 0;

const DOCK_CANDIDATES = [
    { x1: 750, y1: 335, x2: 910, y2: 390 },
    { x1: 750, y1: 555, x2: 910, y2: 610 },
    { x1: 750, y1: 150, x2: 910, y2: 205 },
];
let DOCK = DOCK_CANDIDATES[0];

function isPassable(offCtx, mapW, mapH, px, py) {
    const ix = Math.round((px / CW) * mapW);
    const iy = Math.round((py / CH) * mapH);
    if (ix < 0 || iy < 0 || ix >= mapW || iy >= mapH) return false;

    const [r, g, b] = offCtx.getImageData(ix, iy, 1, 1).data;

    if (b > 90 && b > r + 12 && b > g - 12) return true;
    if (g > 110 && g > r + 25 && g > b + 10) return true;

    return false;
}

function shipCollides(offCtx, mapW, mapH, cx, cy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = HIT_W / 2;
    const hh = HIT_H / 2;

    for (let i = -2; i <= 2; i += 1) {
        for (let j = -1; j <= 1; j += 1) {
            const lx = (i / 2) * hw;
            const ly = j * hh;
            const wx = cx + lx * cos - ly * sin;
            const wy = cy + lx * sin + ly * cos;
            if (pointInDock(wx, wy)) continue;
            if (!isPassable(offCtx, mapW, mapH, wx, wy)) return true;
        }
    }
    return false;
}

function pointInDock(px, py) {
    return px >= DOCK.x1 && px <= DOCK.x2 && py >= DOCK.y1 && py <= DOCK.y2;
}

function isDocked(cx, cy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const halfL = SW / 2;
    const halfB = SH / 2;
    let inside = 0;
    let total  = 0;
    for (let i = -2; i <= 2; i += 1) {
        for (let j = -1; j <= 1; j += 1) {
            const lx = (i / 2) * halfL;
            const ly = j * halfB;
            const wx = cx + lx * cos - ly * sin;
            const wy = cy + lx * sin + ly * cos;
            total += 1;
            if (pointInDock(wx, wy)) inside += 1;
        }
    }
    return inside * 2 >= total;
}

function findSafeSpawn(offCtx, mapW, mapH, hintX, hintY) {
    const testAngles = [
        START_A,
        START_A + Math.PI / 6,
        START_A - Math.PI / 6,
        START_A + Math.PI / 3,
        START_A - Math.PI / 3,
    ];
    for (let r = 0; r <= 380; r += 6) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
            const x = hintX + Math.cos(a) * r;
            const y = hintY + Math.sin(a) * r;
            let ok = true;
            for (const ang of testAngles) {
                if (shipCollides(offCtx, mapW, mapH, x, y, ang)) { ok = false; break; }
            }
            if (ok) return [x, y];
        }
    }
    return [hintX, hintY];
}

function drawShip(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,20,0.45)';
    ctx.beginPath();
    ctx.ellipse(5, 6, w / 2 + 2, h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const hullPath = (offX = 0, offY = 0, expand = 0) => {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 6 + offX,           -h / 2 + offY - expand);
        ctx.lineTo( w / 2 - 18 + offX,          -h / 2 + offY - expand);
        ctx.quadraticCurveTo(
            w / 2 + 4 + offX, -h / 2 + 2 + offY - expand,
            w / 2 + 7 + offX, 0 + offY,
        );
        ctx.quadraticCurveTo(
            w / 2 + 4 + offX,  h / 2 - 2 + offY + expand,
            w / 2 - 18 + offX, h / 2 + offY + expand,
        );
        ctx.lineTo(-w / 2 + 6 + offX,            h / 2 + offY + expand);
        ctx.quadraticCurveTo(
            -w / 2 - 2 + offX, 0 + offY,
            -w / 2 + 6 + offX, -h / 2 + offY - expand,
        );
        ctx.closePath();
    };

    ctx.fillStyle = '#3a0d08';
    hullPath(0, 2.5, 1);
    ctx.fill();

    const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    hullGrad.addColorStop(0,   '#c8362a');
    hullGrad.addColorStop(0.5, '#a82a20');
    hullGrad.addColorStop(1,   '#7a1e16');
    ctx.fillStyle = hullGrad;
    hullPath();
    ctx.fill();

    const hlGrad = ctx.createLinearGradient(0, -h / 2, 0, -h / 6);
    hlGrad.addColorStop(0, 'rgba(255,220,200,0.40)');
    hlGrad.addColorStop(1, 'rgba(255,220,200,0)');
    ctx.fillStyle = hlGrad;
    hullPath();
    ctx.fill();

    ctx.strokeStyle = '#1a0604';
    ctx.lineWidth   = 1.4;
    hullPath();
    ctx.stroke();

    ctx.fillStyle = '#d8cba0';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 10, -h / 2 + 3.5);
    ctx.lineTo( w / 2 - 22, -h / 2 + 3.5);
    ctx.quadraticCurveTo(w / 2 - 6, 0,  w / 2 - 22,  h / 2 - 3.5);
    ctx.lineTo(-w / 2 + 10,  h / 2 - 3.5);
    ctx.quadraticCurveTo(-w / 2 + 2, 0, -w / 2 + 10, -h / 2 + 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth   = 0.6;
    ctx.stroke();

    const brX = -w / 2 + 12;
    const brY = -h / 2 + 5.5;
    const brW = w * 0.22;
    const brH = h - 11;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(brX + 1.5, brY + brH - 0.5, brW + 1.5, 2.5);
    ctx.fillRect(brX + brW, brY + 1.5, 2, brH);

    const brGrad = ctx.createLinearGradient(0, brY, 0, brY + brH);
    brGrad.addColorStop(0,   '#ffffff');
    brGrad.addColorStop(0.6, '#e2e5e6');
    brGrad.addColorStop(1,   '#a8adb0');
    ctx.fillStyle = brGrad;
    ctx.fillRect(brX, brY, brW, brH);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 0.7;
    ctx.strokeRect(brX, brY, brW, brH);

    ctx.fillStyle = '#1a3142';
    for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(brX + 2 + i * 7, brY + 2.5, 4, brH - 5);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(brX + 2 + i * 7, brY + 2.5, 4, 0.8);
    }

    const fX = brX + brW + 3;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(fX + 5, -3, 1.5, 7);
    const fGrad = ctx.createLinearGradient(fX, 0, fX + 5, 0);
    fGrad.addColorStop(0,   '#d23a30');
    fGrad.addColorStop(0.5, '#a82a20');
    fGrad.addColorStop(1,   '#5a160f');
    ctx.fillStyle = fGrad;
    ctx.fillRect(fX, -4, 5, 8);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(fX, -1.5, 5, 1.6);
    ctx.strokeStyle = '#1a0604';
    ctx.lineWidth   = 0.6;
    ctx.strokeRect(fX, -4, 5, 8);

    const cX = fX + 8;
    const cW = (w / 2 - 22) - cX;
    const palette = ['#c98a3c', '#3a6e8e', '#5a8040', '#a83329', '#c98a3c', '#3a6e8e'];
    const blocks  = 6;
    const bw      = cW / blocks;
    const cTop    = -h / 2 + 6.5;
    const cBot    =  h / 2 - 6.5;
    for (let i = 0; i < blocks; i += 1) {
        const bx = cX + i * bw + 0.4;
        const bW = bw - 0.8;

        ctx.fillStyle = palette[i % palette.length];
        ctx.fillRect(bx, cTop, bW, cBot - cTop);

        ctx.fillStyle = 'rgba(255,255,255,0.30)';
        ctx.fillRect(bx, cTop, bW, 1.2);

        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(bx, cBot - 1.4, bW, 1.4);

        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, cTop, bW, cBot - cTop);
    }

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(w / 2 - 14, -1, 7, 1.4);
    ctx.fillRect(w / 2 - 11, -3, 1.2, 6);
}

export default function ParkingGame({ onComplete, shipName }) {
    const canvasRef = useRef(null);
    const [outcome, setOutcome] = useState(null);

    const stateRef = useRef({
        x: SPAWN_HINT_X,
        y: SPAWN_HINT_Y,
        angle: START_A,
        speed: 0,
        keys: new Set(),
        started: false,
        done: false,
        crashFlash: 0,
        wakeT: 0,
        mapImg: null,
        offCtx: null,
        mapW: 1,
        mapH: 1,
        lastTime: 0,
        animId: null,
    });

    const handleKey = useCallback((e, down) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const s = stateRef.current;
        if (down) { s.keys.add(e.key); s.started = true; }
        else      { s.keys.delete(e.key); }
    }, []);

    const finish = useCallback((kind) => {
        const s = stateRef.current;
        s.done = true;
        s.keys.clear();
        setOutcome(kind);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        DOCK = DOCK_CANDIDATES[Math.floor(Math.random() * DOCK_CANDIDATES.length)];

        s.x = SPAWN_HINT_X; s.y = SPAWN_HINT_Y; s.angle = START_A;
        s.speed = 0;
        s.keys = new Set();
        s.started = false;
        s.done = false;
        s.crashFlash = 0;
        s.wakeT = 0;

        canvas.focus();

        const onKeyDown = e => handleKey(e, true);
        const onKeyUp   = e => handleKey(e, false);

        ctx.fillStyle = '#0b1220';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#7fbfff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading harbour map …', CW / 2, CH / 2);

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

            const [sx, sy] = findSafeSpawn(s.offCtx, s.mapW, s.mapH, SPAWN_HINT_X, SPAWN_HINT_Y);
            s.x = sx; s.y = sy;

            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup',   onKeyUp);
            s.lastTime = performance.now();
            s.animId   = requestAnimationFrame(loop);
        };
        mapImg.onerror = () => console.error('ParkingGame: map image failed to load');
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

            let turn = 0;
            if (s.keys.has('ArrowLeft'))  turn -= 1;
            if (s.keys.has('ArrowRight')) turn += 1;

            let thrust = 0;
            if (s.keys.has('ArrowUp'))   thrust = +1;
            if (s.keys.has('ArrowDown')) thrust = -1;

            if (thrust > 0) {
                if (s.speed < 0) {
                    s.speed = Math.min(0, s.speed + (ACCEL + BRAKE) * dt);
                } else {
                    s.speed = Math.min(FWD_SPEED, s.speed + ACCEL * dt);
                }
            } else if (thrust < 0) {
                if (s.speed > 0) {
                    s.speed = Math.max(0, s.speed - (ACCEL + BRAKE) * dt);
                } else {
                    s.speed = Math.max(-REV_SPEED, s.speed - ACCEL * dt);
                }
            } else {
                if (s.speed > 0) s.speed = Math.max(0, s.speed - FRICTION * dt);
                else if (s.speed < 0) s.speed = Math.min(0, s.speed + FRICTION * dt);
            }

            const speedFrac = Math.min(1, Math.abs(s.speed) / FWD_SPEED);
            const turnRate  = TURN_RATE * (IDLE_TURN + (1 - IDLE_TURN) * speedFrac);

            if (turn !== 0) {
                const dir = s.speed < -1 ? -1 : 1;
                const newAngle = s.angle + turn * dir * turnRate * dt;
                if (!shipCollides(s.offCtx, s.mapW, s.mapH, s.x, s.y, newAngle)) {
                    s.angle = newAngle;
                }
            }

            const vx = Math.cos(s.angle) * s.speed;
            const vy = Math.sin(s.angle) * s.speed;

            const nx = s.x + vx * dt;
            const ny = s.y + vy * dt;

            if (s.started && Math.abs(s.speed) > 0.5) {
                const oob =
                    nx < HIT_W / 2 || nx > CW - HIT_W / 2 ||
                    ny < HIT_H / 2 || ny > CH - HIT_H / 2;

                const collided = oob || shipCollides(
                    s.offCtx, s.mapW, s.mapH, nx, ny, s.angle,
                );

                if (collided) {
                    s.crashFlash = 1;
                    render();
                    finish('crash');
                    s.animId = requestAnimationFrame(loop);
                    return;
                }
            }

            if (s.started && isDocked(nx, ny, s.angle)) {
                s.x = nx; s.y = ny;
                s.speed = 0;
                render();
                finish('success');
                return;
            }

            if (Math.abs(s.speed) > 1) s.wakeT += dt * 6;

            s.x = nx;
            s.y = ny;
            render();
            s.animId = requestAnimationFrame(loop);
        }

        function render() {
            ctx.drawImage(s.mapImg, 0, 0, CW, CH);

            const t  = performance.now() / 600;
            const dx = DOCK.x1, dy = DOCK.y1;
            const dw = DOCK.x2 - DOCK.x1, dh = DOCK.y2 - DOCK.y1;
            ctx.fillStyle = `rgba(80, 230, 110, ${0.18 + 0.10 * Math.sin(t)})`;
            ctx.fillRect(dx, dy, dw, dh);
            ctx.strokeStyle = '#7ef089';
            ctx.lineWidth   = 3;
            ctx.setLineDash([10, 6]);
            ctx.strokeRect(dx + 1.5, dy + 1.5, dw - 3, dh - 3);
            ctx.setLineDash([]);

            const speedAbs = Math.abs(s.speed);
            if (speedAbs > 5) {
                const sternDir = s.speed > 0 ? -1 : 1;
                const intensity = Math.min(1, speedAbs / FWD_SPEED);
                for (let i = 1; i <= 3; i += 1) {
                    const d = sternDir * (SW / 2 + 4 + i * 9 + (s.wakeT % 4));
                    const wx = s.x + Math.cos(s.angle) * d;
                    const wy = s.y + Math.sin(s.angle) * d;
                    ctx.fillStyle = `rgba(255,255,255,${(0.42 - i * 0.1) * intensity})`;
                    ctx.beginPath();
                    ctx.arc(wx, wy, (4 - i) + intensity, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            drawShip(ctx, SW, SH);
            ctx.restore();

            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, CW, 56);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                `⚓  Bring ${shipName ?? 'the ship'} safely to the green dock`,
                CW / 2, 36,
            );

            if (!s.started) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, CH - 110, CW, 110);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 26px sans-serif';
                ctx.fillText('↑ Forward    ↓ Reverse    ← Steer left    → Steer right', CW / 2, CH - 65);
                ctx.font = '18px sans-serif';
                ctx.fillStyle = '#cfe6ff';
                ctx.fillText('Press an arrow key to start.', CW / 2, CH - 30);
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
    }, [handleKey, finish, shipName]);

    return (
        <div
            style={{
                position:        'fixed',
                inset:           0,
                backgroundColor: '#000',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          2500,
                overflow:        'hidden',
            }}
        >
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

            {outcome && (
                <div style={{
                    position:        'absolute',
                    inset:           0,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    zIndex:          20,
                }}>
                    <div style={{
                        backgroundColor: '#1a1f2e',
                        border:          outcome === 'success'
                                            ? '2px solid rgba(80,230,110,0.45)'
                                            : '2px solid rgba(255,90,90,0.45)',
                        borderRadius:    '12px',
                        padding:         '28px 32px',
                        maxWidth:        '420px',
                        width:           '90%',
                        textAlign:       'center',
                        boxShadow:       '0 12px 40px rgba(0,0,0,0.8)',
                    }}>
                        <h2 style={{
                            margin:    '0 0 10px',
                            color:     outcome === 'success' ? '#7be39a' : '#ff7676',
                            fontSize:  '28px',
                        }}>
                            {outcome === 'success' ? 'Docked!' : 'Crash!'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary, #aab1bd)', fontSize: '15px', margin: '0 0 18px' }}>
                            {outcome === 'success'
                                ? 'You parked the ship safely in the green dock.'
                                : 'Your ship hit a wall or pier.'}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => onComplete?.(outcome === 'success', outcome === 'success' ? 100 : 0)}
                            style={{ width: '100%', fontSize: '15px', padding: '10px' }}
                            autoFocus
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
