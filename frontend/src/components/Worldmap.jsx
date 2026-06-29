import { useState, useEffect, useLayoutEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import mapBackground from '../assets/worldmap/new_map_upscaled.jpeg';
import shipIcon from '../assets/worldmap/ship.png';
import { ShipStatus } from '../constants/ShipStatus';
import { catmullRomPath, catmullRomPointAt, polylineCumLengths, fractionalIndexAtDistance } from '../utils/smoothPath';

const WorldMap = forwardRef(function WorldMap({
    ports = [],
    onSelectPort,
    loading = false,
    activeShips = [],
    myPlayerId,
    lastTickTimestamp,
    tickIntervalMs,
    isSelectingPort = false,
    previewWaypoints = null,
    previewIsAlternative = false,
}, ref) {
    const MAX_X = 1000;
    const MAX_Y = 1000;
    const ASPECT = 16 / 9;
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 5;

    const [hoveredPort,   setHoveredPort]   = useState(null);
    const [shipPositions, setShipPositions] = useState({});
    const shipAnimRef = useRef({});

    const viewportRef = useRef(null);
    const [base, setBase] = useState({ w: 0, h: 0, left: 0, top: 0, vw: 0, vh: 0 });

    const [zoom, setZoom] = useState(1);
    const [tx, setTx]     = useState(0);
    const [ty, setTy]     = useState(0);
    const [dragging, setDragging] = useState(false);

    const baseRef = useRef(base);
    const zoomRef = useRef(1);
    const txRef   = useRef(0);
    const tyRef   = useRef(0);
    const dragRef = useRef(null);
    const movedRef = useRef(false);
    const markerRefs = useRef({});

    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { txRef.current   = tx;   }, [tx]);
    useEffect(() => { tyRef.current   = ty;   }, [ty]);

    const clampPan = useCallback((nx, ny, z, b) => {
        const maxX = -b.left;
        const minX = b.vw - b.left - b.w * z;
        const maxY = -b.top;
        const minY = b.vh - b.top - b.h * z;
        return [
            Math.min(maxX, Math.max(minX, nx)),
            Math.min(maxY, Math.max(minY, ny)),
        ];
    }, []);

    const applyView = useCallback((nz, nx, ny) => {
        const [cx, cy] = clampPan(nx, ny, nz, baseRef.current);
        zoomRef.current = nz; txRef.current = cx; tyRef.current = cy;
        setZoom(nz); setTx(cx); setTy(cy);
    }, [clampPan]);

    const zoomAround = useCallback((factor, fx, fy) => {
        const z  = zoomRef.current;
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
        if (nz === z) return;
        const localX = (fx - txRef.current) / z;
        const localY = (fy - tyRef.current) / z;
        applyView(nz, fx - localX * nz, fy - localY * nz);
    }, [applyView]);

    useLayoutEffect(() => {
        const el = viewportRef.current;
        if (!el) return undefined;
        const compute = () => {
            const vw = el.clientWidth, vh = el.clientHeight;
            if (!vw || !vh) return;
            let w = vw, h = vw / ASPECT;
            if (h < vh) { h = vh; w = vh * ASPECT; }
            setBase({ w, h, left: (vw - w) / 2, top: (vh - h) / 2, vw, vh });
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ASPECT]);

    useEffect(() => {
        baseRef.current = base;
        const [cx, cy] = clampPan(txRef.current, tyRef.current, zoomRef.current, base);
        if (cx !== txRef.current || cy !== tyRef.current) {
            txRef.current = cx; tyRef.current = cy; setTx(cx); setTy(cy);
        }
    }, [base, clampPan]);

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            e.preventDefault();
            const b = baseRef.current;
            if (!b.w) return;
            const rect = el.getBoundingClientRect();
            const fx = e.clientX - rect.left - b.left;
            const fy = e.clientY - rect.top  - b.top;
            zoomAround(e.deltaY < 0 ? 1.15 : 1 / 1.15, fx, fy);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoomAround]);

    const onPointerDown = (e) => {
        if (e.button !== 0) return;
        dragRef.current = { x: e.clientX, y: e.clientY, tx: txRef.current, ty: tyRef.current };
        movedRef.current = false;
        setDragging(true);
    };
    const onPointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!movedRef.current && Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true;
        const [cx, cy] = clampPan(d.tx + dx, d.ty + dy, zoomRef.current, baseRef.current);
        txRef.current = cx; tyRef.current = cy; setTx(cx); setTy(cy);
    };
    const onPointerUp = () => {
        if (dragRef.current) { dragRef.current = null; setDragging(false); }
    };

    const resetView = useCallback(() => { applyView(1, 0, 0); }, [applyView]);

    useImperativeHandle(ref, () => ({
        zoomIn:    () => zoomAround(1.3,     baseRef.current.w / 2, baseRef.current.h / 2),
        zoomOut:   () => zoomAround(1 / 1.3, baseRef.current.w / 2, baseRef.current.h / 2),
        resetView,
    }), [zoomAround, resetView]);

    const activeShipsRef     = useRef(activeShips);
    const lastTickTsRef      = useRef(lastTickTimestamp);
    const tickIntervalMsRef  = useRef(tickIntervalMs);

    useEffect(() => { activeShipsRef.current    = activeShips;       }, [activeShips]);
    useEffect(() => { lastTickTsRef.current     = lastTickTimestamp; }, [lastTickTimestamp]);
    useEffect(() => { tickIntervalMsRef.current = tickIntervalMs;    }, [tickIntervalMs]);

    const portMapRef = useRef({});
    useEffect(() => {
        const m = {};
        for (const p of ports) m[p.id] = p;
        portMapRef.current = m;
    }, [ports]);

    useEffect(() => {
        let rafId;
        let lastFrame = 0;
        const loop = () => {
            const now      = Date.now();
            const ships    = activeShipsRef.current;
            const interval = tickIntervalMsRef.current || 5000;
            const portMap  = portMapRef.current;
            const anim     = shipAnimRef.current;
            const seen     = new Set();

            const rawGap = now - (lastFrame || now);
            lastFrame = now;
            const resumed = rawGap > 500;
            let frameDt = rawGap < 0 ? 0 : (rawGap > 100 ? 100 : rawGap);

            const place = (ship, moving) => {
                const wps = ship.activeRouteWaypoints;
                if (!wps || wps.length < 2) return null;
                const cum = polylineCumLengths(wps);
                const total = cum[cum.length - 1];
                if (!(total > 0)) return null;

                const R = Math.max(0, Math.min(ship.routeProgress ?? 0, total));
                const perTick = ship.distancePerTick > 0 ? ship.distancePerTick : 0;
                const speedPerMs = interval > 0 ? perTick / interval : 0;

                let a = anim[ship.shipId];
                if (!a) {
                    const startDist = (moving && R <= perTick * 1.5) ? 0 : R;
                    a = { from: startDist, auth: R, authT: now, dist: startDist, flip: 1 };
                }
                if (R !== a.auth) { a.from = a.dist; a.auth = R; a.authT = now; }

                let target;
                if (moving && interval > 0) {
                    const f = Math.min(1, (now - a.authT) / interval);
                    target = a.from + (R - a.from) * f;
                } else {
                    a.from = a.dist;
                    a.authT = now;
                    target = R;
                }

                const frameStep = speedPerMs * frameDt;
                const maxMove   = frameStep * 2 + 0.05;
                const delta     = target - a.dist;
                if (resumed || Math.abs(delta) > perTick * 1.5) {
                    a.dist = target;
                } else {
                    a.dist += Math.max(-maxMove, Math.min(maxMove, delta));
                }
                a.dist = Math.max(0, Math.min(a.dist, total));

                const p = catmullRomPointAt(wps, fractionalIndexAtDistance(cum, a.dist));
                const dirX = Math.cos((p.angle * Math.PI) / 180);
                if (dirX > 0.3) a.flip = -1;
                else if (dirX < -0.3) a.flip = 1;

                anim[ship.shipId] = a;
                seen.add(ship.shipId);
                return { x: p.x, y: p.y, flip: a.flip };
            };

            const positions = {};
            for (const ship of ships) {
                if (ship.status === ShipStatus.IN_TRANSIT) {
                    const pos = place(ship, true);
                    if (pos) positions[ship.shipId] = pos;
                } else if (
                    ship.status === ShipStatus.AWAITING_PILOT ||
                    ship.status === ShipStatus.MINIGAME_WAITING ||
                    ship.status === ShipStatus.MINIGAME_ACTIVE
                ) {
                    const pos = place(ship, false);
                    if (pos) {
                        positions[ship.shipId] = pos;
                    } else if (ship.currentPortId) {
                        const port = portMap[ship.currentPortId];
                        if (port) positions[ship.shipId] = { x: port.x, y: port.y, flip: 1 };
                    }
                } else if (ship.currentPortId) {
                    const port = portMap[ship.currentPortId];
                    if (port) positions[ship.shipId] = { x: port.x, y: port.y, flip: 1 };
                }
            }
            for (const id in anim) { if (!seen.has(id)) delete anim[id]; }

            setShipPositions(positions);
            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const portDotStyle = () => {
        if (isSelectingPort) return { bg: '#fc0f0f', scale: 0.8 };
        return { bg: '#64748b', scale: 0.8 };
    };
    const shipFilter = (isOwn) => isOwn
        ? 'drop-shadow(0 0 5px rgba(15,240,252,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.7))'
        : 'drop-shadow(0 0 5px rgba(255,160,0,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.7)) sepia(1) saturate(4) hue-rotate(10deg)';

    const stageToScreen = (x, y) => ({
        left: base.left + tx + (x / MAX_X) * base.w * zoom,
        top:  base.top  + ty + (y / MAX_Y) * base.h * zoom,
    });

    const focusPortInDirection = useCallback((fromPort, key) => {
        const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
        const sign = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
        let best = null, bestScore = Infinity;
        for (const p of ports) {
            if (p.id === fromPort.id) continue;
            const primary = horizontal ? (p.x - fromPort.x) : (p.y - fromPort.y);
            if (Math.sign(primary) !== sign) continue;
            const cross = horizontal ? (p.y - fromPort.y) : (p.x - fromPort.x);
            const score = Math.abs(primary) + 2 * Math.abs(cross);
            if (score < bestScore) { bestScore = score; best = p; }
        }
        if (best) markerRefs.current[best.id]?.focus();
    }, [ports]);

    const routePath = (wps) => {
        if (!wps || wps.length < 2) return '';
        return catmullRomPath(wps.map(wp => {
            const s = stageToScreen(wp.x, wp.y);
            return { x: s.left, y: s.top };
        }));
    };

    return (
        <div
            ref={viewportRef}
            className="map-viewport"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                touchAction: 'none', background: 'var(--bg-abyss)',
                cursor: dragging ? 'grabbing' : 'grab',
            }}
        >
            <div
                className="map-scale-wrapper"
                style={{
                    position: 'absolute',
                    left: base.left, top: base.top,
                    width: base.w || '100%', height: base.h || '100%',
                    transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    willChange: 'transform',
                }}
            >
                <img
                    src={mapBackground}
                    alt="World Map"
                    draggable={false}
                    style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
                    onClick={(e) => {
                        if (movedRef.current) return;
                        const x = Math.round((e.nativeEvent.offsetX / e.target.offsetWidth)  * 1000);
                        const y = Math.round((e.nativeEvent.offsetY / e.target.offsetHeight) * 1000);
                        console.log(`new Waypoint(${x},${y})`);
                    }}
                />
            </div>

            <div
                className={`map-overlay${isSelectingPort ? ' selecting' : ''}`}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
            >
                <svg
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                    preserveAspectRatio="none"
                >
                    {(() => {
                        const d = routePath(previewWaypoints);
                        if (!d) return null;
                        const dash = previewIsAlternative ? '#38bdf8' : '#ff7a6e';
                        return (
                            <g>
                                <path d={d} fill="none" stroke="rgba(0,0,0,0.45)"
                                    strokeWidth={4} strokeLinecap="round" />
                                <path className="route-preview-dash" d={d} fill="none"
                                    stroke={dash} strokeWidth={2}
                                    strokeDasharray="2 9" strokeLinecap="round" opacity={0.9} />
                            </g>
                        );
                    })()}

                    {activeShips.map(ship => {
                        if (ship.playerId !== myPlayerId) return null;
                        const d = routePath(ship.activeRouteWaypoints);
                        if (!d) return null;
                        return (
                            <g key={ship.shipId}>
                                <path d={d} fill="none" stroke="rgba(0,0,0,0.4)"
                                    strokeWidth={3.5} strokeLinecap="round" />
                                <path d={d} fill="none" stroke="#ff3b30"
                                    strokeWidth={2} strokeDasharray="2 9"
                                    strokeLinecap="round" opacity={0.95} />
                            </g>
                        );
                    })}
                </svg>

                {ports.map(port => {
                    const dot       = portDotStyle(port);
                    const isHovered = hoveredPort?.id === port.id;
                    const clickable = !loading && !!onSelectPort;
                    const s         = stageToScreen(port.x, port.y);

                    return (
                        <div
                            key={port.id}
                            ref={el => { if (el) markerRefs.current[port.id] = el; else delete markerRefs.current[port.id]; }}
                            className={`map-marker${loading ? ' disabled' : ''}`}
                            role="button"
                            tabIndex={clickable ? 0 : -1}
                            aria-label={`${port.name} — ${isSelectingPort ? 'set as home port' : 'view port'}`}
                            aria-disabled={!clickable}
                            style={{
                                position: 'absolute',
                                left:     s.left,
                                top:      s.top,
                                cursor:   clickable ? 'pointer' : 'default',
                                pointerEvents: 'auto',
                            }}
                            onClick={() => { if (movedRef.current) return; if (clickable) onSelectPort(port); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (clickable) onSelectPort(port);
                                } else if (e.key.startsWith('Arrow')) {
                                    e.preventDefault();
                                    focusPortInDirection(port, e.key);
                                }
                            }}
                            onMouseEnter={() => setHoveredPort(port)}
                            onMouseLeave={() => setHoveredPort(null)}
                            onFocus={() => setHoveredPort(port)}
                            onBlur={() => setHoveredPort(h => (h?.id === port.id ? null : h))}
                        >
                            <div
                                className="marker-dot"
                                style={{
                                    backgroundColor: dot.bg,
                                    transform:  `scale(${dot.scale})`,
                                    boxShadow:  isHovered
                                        ? `0 0 14px ${dot.bg}`
                                        : `0 0 6px ${dot.bg}60`,
                                }}
                            />

                            {isHovered && (
                                <div style={{
                                    position:   'absolute',
                                    bottom:     '20px',
                                    left:       '50%',
                                    transform:  'translateX(-50%)',
                                    background: 'rgba(3,8,14,0.95)',
                                    border:     '1px solid rgba(15,240,252,0.3)',
                                    color:      '#fff',
                                    padding:    '6px 12px',
                                    borderRadius: '6px',
                                    fontSize:   '12px',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 2,
                                    isolation: 'isolate',
                                    boxShadow:  '0 4px 16px rgba(0,0,0,0.8)',
                                }}>
                                    <strong style={{ display: 'block', color: 'var(--neon-cyan)', letterSpacing: '0.05em' }}>
                                        {port.name}
                                    </strong>
                                    <span style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                                        {isSelectingPort ? 'Click or Enter to set as home port' : 'Click or Enter to view port'}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {activeShips.map(ship => {
                    const pos = shipPositions[ship.shipId];
                    if (!pos) return null;
                    const isOwn    = ship.playerId === myPlayerId;
                    const seized   = ship.status === 'SEIZED';
                    const customsActive = isOwn
                        && !seized
                        && ship.customsStatus
                        && ship.customsStatus !== 'NONE';
                    const opacity = seized ? 0.6 : isOwn ? 1 : 0.7;
                    const s        = stageToScreen(pos.x, pos.y);

                    return (
                        <div
                            key={ship.shipId}
                            style={{
                                position:  'absolute',
                                left:      s.left,
                                top:       s.top,
                                width:     '32px',
                                height:    '32px',
                                transform: 'translate(-50%, -50%)',
                                zIndex:    isOwn ? 22 : 20,
                                opacity,
                                pointerEvents: 'none',
                            }}
                        >
                            <img
                                src={shipIcon}
                                alt={ship.shipName}
                                style={{
                                    width:      '100%',
                                    height:     '100%',
                                    display:    'block',
                                    transform:  `scaleX(${pos.flip ?? 1})`,
                                    filter:     seized ? 'grayscale(1) brightness(0.7)' : shipFilter(isOwn),
                                    transition: 'transform 0.2s ease',
                                }}
                            />
                            <div style={{
                                position:   'absolute',
                                bottom:     '36px',
                                left:       '50%',
                                transform:  'translateX(-50%)',
                                zIndex:     1,
                                background: seized
                                    ? 'rgba(75,75,80,0.92)'
                                    : customsActive
                                        ? 'rgba(120,10,10,0.92)'
                                        : 'rgba(3,8,14,0.9)',
                                border:     `1px solid ${
                                    seized        ? 'rgba(170,170,175,0.55)'
                                    : customsActive ? 'rgba(244,67,54,0.85)'
                                    : isOwn       ? 'rgba(15,240,252,0.35)'
                                                  : 'rgba(255,160,0,0.35)'}`,
                                color:      seized ? '#d4d4d8'
                                           : customsActive ? '#ffd6d6'
                                           : isOwn       ? '#fff'
                                                         : '#ffd580',
                                padding:    '2px 8px',
                                fontSize:   '10px',
                                fontWeight: '700',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                            }}>
                                {seized
                                    ? `${ship.shipName || 'Ship'} (seized)`
                                    : customsActive
                                        ? `${ship.shipName || 'Ship'}`
                                        : isOwn
                                            ? `${ship.shipName || 'Ship'}`
                                            : ship.playerName
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default WorldMap;
