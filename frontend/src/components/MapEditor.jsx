import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { gameService } from '../api/gameService';
import mapBackground from '../assets/worldmap/new_map_upscaled.jpeg';
import { catmullRomPath } from '../utils/smoothPath';

const ASPECT = 16 / 9;
const LS_KEY = 'pof:mapeditor:v1';
const MAX_ZOOM = 8;

const sanitizeVar = (name) =>
    (name.trim().split(/\s+/).map((w, i) =>
        i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('').replace(/[^a-zA-Z0-9]/g, '')) || 'port';

function loadSaved() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

const MAX_FUEL = 100;
const FUEL = { low: 3, medium: 5, high: 7 };
function tickInfo(ticks) {
    const fuelHigh = ticks * FUEL.high;
    if (ticks * FUEL.high <= MAX_FUEL)   return { fuelHigh, color: '#4ade80', label: 'all ships' };
    if (ticks * FUEL.medium <= MAX_FUEL) return { fuelHigh, color: '#fbbf24', label: 'no High-Tech' };
    if (ticks * FUEL.low <= MAX_FUEL)    return { fuelHigh, color: '#fb923c', label: 'Low-Cost only' };
    return { fuelHigh, color: '#f87171', label: 'unsailable!' };
}

export default function MapEditor() {
    const viewportRef = useRef(null);
    const stageRef    = useRef(null);
    const [base, setBase] = useState({ w: 0, h: 0, left: 0, top: 0, vw: 0, vh: 0 });

    const [ports, setPorts] = useState(() => loadSaved()?.ports ?? []);
    const [edges, setEdges] = useState(() => loadSaved()?.edges ?? []);
    const [loaded, setLoaded] = useState(() => loadSaved() != null);

    const [mode, setMode]     = useState('move');
    const [draft, setDraft]   = useState(null);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [importText, setImportText] = useState('');
    const dragIdxRef = useRef(null);

    const [zoom, setZoom] = useState(1);
    const [tx, setTx]     = useState(0);
    const [ty, setTy]     = useState(0);
    const baseRef = useRef(base);
    const zoomRef = useRef(1);
    const txRef   = useRef(0);
    const tyRef   = useRef(0);
    const panRef  = useRef(null);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { txRef.current = tx; }, [tx]);
    useEffect(() => { tyRef.current = ty; }, [ty]);

    const clampPan = useCallback((nx, ny, z, b) => {
        const axis = (n, vsize, bstart, bsize) => {
            const scaled = bsize * z;
            if (scaled >= vsize) return Math.min(-bstart, Math.max(vsize - bstart - scaled, n));
            return (vsize - scaled) / 2 - bstart;
        };
        return [axis(nx, b.vw, b.left, b.w), axis(ny, b.vh, b.top, b.h)];
    }, []);
    const applyView = useCallback((nz, nx, ny) => {
        const [cx, cy] = clampPan(nx, ny, nz, baseRef.current);
        zoomRef.current = nz; txRef.current = cx; tyRef.current = cy;
        setZoom(nz); setTx(cx); setTy(cy);
    }, [clampPan]);
    const zoomAround = useCallback((factor, fx, fy) => {
        const z = zoomRef.current;
        const nz = Math.min(MAX_ZOOM, Math.max(1, z * factor));
        if (nz === z) return;
        const lx = (fx - txRef.current) / z, ly = (fy - tyRef.current) / z;
        applyView(nz, fx - lx * nz, fy - ly * nz);
    }, [applyView]);

    useEffect(() => {
        if (loaded) return;
        gameService.getPorts()
            .then(ps => setPorts((ps || []).map(p => ({ name: p.name, x: p.x, y: p.y }))))
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, [loaded]);

    useEffect(() => {
        if (loaded) localStorage.setItem(LS_KEY, JSON.stringify({ ports, edges }));
    }, [ports, edges, loaded]);

    useLayoutEffect(() => {
        const el = viewportRef.current;
        if (!el) return undefined;
        const compute = () => {
            const vw = el.clientWidth, vh = el.clientHeight;
            if (!vw || !vh) return;
            let w = vw, h = vw / ASPECT;
            if (h > vh) { h = vh; w = vh * ASPECT; }
            setBase({ w, h, left: (vw - w) / 2, top: (vh - h) / 2, vw, vh });
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        baseRef.current = base;
        const [cx, cy] = clampPan(txRef.current, tyRef.current, zoomRef.current, base);
        txRef.current = cx; tyRef.current = cy; setTx(cx); setTy(cy);
    }, [base, clampPan]);

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            e.preventDefault();
            const b = baseRef.current;
            if (!b.w) return;
            const r = el.getBoundingClientRect();
            zoomAround(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left - b.left, e.clientY - r.top - b.top);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoomAround]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setDraft(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const screenToGrid = useCallback((clientX, clientY) => {
        const r = stageRef.current?.getBoundingClientRect();
        if (!r || !r.width) return null;
        const fx = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        const fy = Math.min(1, Math.max(0, (clientY - r.top)  / r.height));
        return { x: Math.round(fx * 1000), y: Math.round(fy * 1000) };
    }, []);

    const addPort    = (name, g) => setPorts(p => [...p, { name, x: g.x, y: g.y }]);
    const updatePort = (i, g)    => setPorts(p => p.map((pt, idx) => idx === i ? { ...pt, x: g.x, y: g.y } : pt));
    const renamePort = (i) => {
        const cur = ports[i];
        const n = prompt('Port name?', cur.name);
        if (!n || !n.trim()) return;
        const next = n.trim();
        setPorts(p => p.map((pt, idx) => idx === i ? { ...pt, name: next } : pt));
        setEdges(es => es.map(e => ({
            ...e,
            a: e.a === cur.name ? next : e.a,
            b: e.b === cur.name ? next : e.b,
        })));
    };
    const deletePort = (i) => {
        const name = ports[i].name;
        setPorts(p => p.filter((_, idx) => idx !== i));
        setEdges(es => es.filter(e => e.a !== name && e.b !== name));
    };
    const startDraft = (port) => setDraft({ aName: port.name, pts: [{ x: port.x, y: port.y }] });
    const finishEdge = (portB) => {
        setEdges(es => [...es, { a: draft.aName, b: portB.name, waypoints: [...draft.pts, { x: portB.x, y: portB.y }] }]);
        setDraft(null);
    };
    const deleteEdge = (i) => setEdges(es => es.filter((_, idx) => idx !== i));

    const reloadBackend = () => {
        gameService.getPorts()
            .then(ps => { setPorts((ps || []).map(p => ({ name: p.name, x: p.x, y: p.y }))); setEdges([]); setDraft(null); })
            .catch(() => {});
    };

    const doImport = () => {
        let d;
        try { d = JSON.parse(importText); } catch { alert('Invalid JSON.'); return; }
        if (!d || !Array.isArray(d.ports)) { alert('JSON needs a "ports" array.'); return; }
        if (!confirm('Replace the current ports and routes with the pasted JSON?')) return;
        setPorts(d.ports.map(p => ({ name: p.name, x: p.x, y: p.y })));
        setEdges(Array.isArray(d.edges) ? d.edges : []);
        setDraft(null);
        setImportText('');
    };

    const handleWaterClick = (g) => {
        if (mode === 'addPort') {
            const n = prompt('Port name?');
            if (n && n.trim()) addPort(n.trim(), g);
        } else if (mode === 'drawRoute' && draft) {
            setDraft(d => ({ ...d, pts: [...d.pts, g] }));
        }
    };

    const zoomBtn = (f) => () => { const b = baseRef.current; zoomAround(f, b.vw / 2 - b.left, b.vh / 2 - b.top); };
    const resetView = () => applyView(1, 0, 0);

    const jsonText = JSON.stringify({ ports, edges }, null, 2);
    const javaText = (() => {
        const portsJava = ports.map(p => `portRepo.save(new Port("${p.name}", ${p.x}, ${p.y}));`).join('\n');
        const decls = ports.map(p => `Port ${sanitizeVar(p.name)} = require(byName, "${p.name}");`).join('\n');
        const edgesJava = edges.map(e => {
            const wp = e.waypoints.map(w => `new Waypoint(${w.x}, ${w.y})`).join(', ');
            return `addEdge(graph, ${sanitizeVar(e.a)}, ${sanitizeVar(e.b)}, List.of(${wp}));`;
        }).join('\n');
        return `// ── Ports ──\n${portsJava}\n\n// ── Port vars ──\n${decls}\n\n// ── Edges ──\n${edgesJava}`;
    })();

    const copy = (text) => navigator.clipboard?.writeText(text);

    const inv = 1 / zoom;
    const pct = (v) => `${v / 10}%`;

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', background: '#05080f', color: '#e8eef5', fontFamily: 'system-ui, sans-serif' }}>
            <div ref={viewportRef} style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#000' }}>
                <div
                    ref={stageRef}
                    onPointerDown={(e) => {
                        panRef.current = { x: e.clientX, y: e.clientY, tx: txRef.current, ty: tyRef.current, moved: false };
                        e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                        const g = screenToGrid(e.clientX, e.clientY); if (g) setCursor(g);
                        const p = panRef.current; if (!p) return;
                        const dx = e.clientX - p.x, dy = e.clientY - p.y;
                        if (!p.moved && Math.abs(dx) + Math.abs(dy) > 3) p.moved = true;
                        if (p.moved) {
                            const [cx, cy] = clampPan(p.tx + dx, p.ty + dy, zoomRef.current, baseRef.current);
                            txRef.current = cx; tyRef.current = cy; setTx(cx); setTy(cy);
                        }
                    }}
                    onPointerUp={(e) => {
                        const p = panRef.current; panRef.current = null;
                        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { }
                        if (p && !p.moved) { const g = screenToGrid(e.clientX, e.clientY); if (g) handleWaterClick(g); }
                    }}
                    style={{
                        position: 'absolute', left: base.left, top: base.top,
                        width: base.w || '100%', height: base.h || '100%',
                        transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        cursor: mode === 'move' ? 'grab' : 'crosshair',
                    }}
                >
                    <img src={mapBackground} alt="" draggable={false}
                         style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />

                    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                        {edges.map((edge, i) => {
                            const pts = edge.waypoints.map(w => ({ x: w.x / 10, y: w.y / 10 }));
                            return (
                                <g key={i}>
                                    <path d={catmullRomPath(pts)} fill="none" stroke="rgba(0,191,255,0.35)" strokeWidth={1.1 * inv} strokeLinecap="round" />
                                    <path d={catmullRomPath(pts)} fill="none" stroke="#00bfff" strokeWidth={0.45 * inv} strokeLinecap="round" />
                                </g>
                            );
                        })}
                        {draft && (() => {
                            const pts = draft.pts.map(w => ({ x: w.x / 10, y: w.y / 10 }));
                            return (
                                <g>
                                    <path d={catmullRomPath(pts)} fill="none" stroke="#ffd166" strokeWidth={0.55 * inv}
                                          strokeDasharray={`${1.4 * inv},${1.4 * inv}`} strokeLinecap="round" />
                                    {pts.map((p, idx) => <circle key={idx} cx={p.x} cy={p.y} r={0.55 * inv} fill="#ffd166" />)}
                                </g>
                            );
                        })()}
                    </svg>

                    {ports.map((port, i) => {
                        const isDraftStart = draft?.aName === port.name;
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute', left: pct(port.x), top: pct(port.y),
                                    transform: `translate(-50%, -50%) scale(${inv})`, zIndex: 10,
                                    cursor: mode === 'move' ? 'grab' : 'pointer',
                                }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    if (mode === 'move') {
                                        dragIdxRef.current = i;
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                    }
                                }}
                                onPointerMove={(e) => {
                                    if (dragIdxRef.current !== i) return;
                                    const g = screenToGrid(e.clientX, e.clientY);
                                    if (g) updatePort(i, g);
                                }}
                                onPointerUp={(e) => {
                                    if (dragIdxRef.current === i) {
                                        dragIdxRef.current = null;
                                        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { }
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (mode !== 'drawRoute') return;
                                    if (!draft) startDraft(port);
                                    else if (draft.aName !== port.name) finishEdge(port);
                                }}
                                onDoubleClick={(e) => { e.stopPropagation(); renamePort(i); }}
                            >
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: isDraftStart ? '#ffd166' : '#fc4f4f',
                                    border: '2px solid #fff', boxShadow: '0 0 6px rgba(0,0,0,0.7)',
                                }} />
                                <div style={{
                                    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap', fontSize: 11, color: '#fff',
                                    background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 4, pointerEvents: 'none',
                                }}>{port.name}</div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20 }}>
                    <button onClick={zoomBtn(1.3)}     style={zoomCtl} title="Zoom in">+</button>
                    <button onClick={zoomBtn(1 / 1.3)} style={zoomCtl} title="Zoom out">−</button>
                    <button onClick={resetView}        style={zoomCtl} title="Reset view">⟳</button>
                </div>
                <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 20, fontSize: 11, color: '#9fb0c8',
                              background: 'rgba(4,9,15,0.7)', border: '1px solid #1f2c44', borderRadius: 6, padding: '4px 8px' }}>
                    {cursor.x}, {cursor.y} · {Math.round(zoom * 100)}%
                </div>
            </div>

            <aside style={{ width: 340, flexShrink: 0, background: '#0c1322', borderLeft: '1px solid #1f2c44', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2c44' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#ffd166' }}>🗺 Map Editor <span style={{ color: '#64748b', fontWeight: 400 }}>(dev)</span></div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Autosaves to your browser · open with ?edit=1</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[['move', 'Move'], ['addPort', 'Add Port'], ['drawRoute', 'Draw Route']].map(([m, label]) => (
                            <button key={m} onClick={() => { setMode(m); setDraft(null); }}
                                style={modeBtn(mode === m)}>{label}</button>
                        ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#9fb0c8', background: '#0a1120', border: '1px solid #1f2c44', borderRadius: 6, padding: '8px 10px', lineHeight: 1.5 }}>
                        {mode === 'move' && 'Drag a port to reposition it. Double-click to rename.'}
                        {mode === 'addPort' && 'Click the water to drop a new port (you\'ll be asked for a name).'}
                        {mode === 'drawRoute' && (draft
                            ? `Drawing from “${draft.aName}”. Click the water to add waypoints, click another port to finish. Esc cancels.`
                            : 'Click a port to start, then click waypoints along the water, then click the destination port.')}
                        {mode === 'drawRoute' && draft && (() => {
                            const info = tickInfo(draft.pts.length);
                            return (
                                <div style={{ marginTop: 6, color: info.color, fontWeight: 700 }}>
                                    ~{draft.pts.length} ticks · {info.fuelHigh}/100 fuel (High-Tech) · {info.label}
                                </div>
                            );
                        })()}
                        <div style={{ color: '#64748b', marginTop: 6 }}>Wheel = zoom · drag empty water = pan</div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={reloadBackend} style={smallBtn}>Reload ports from backend</button>
                        <button onClick={() => { setEdges([]); setDraft(null); }} style={smallBtn}>Clear edges</button>
                        <button onClick={() => { if (confirm('Clear all ports and edges?')) { setPorts([]); setEdges([]); setDraft(null); } }} style={{ ...smallBtn, color: '#fca5a5', borderColor: '#7f1d1d' }}>Clear all</button>
                    </div>

                    <Section title={`Ports (${ports.length})`}>
                        {ports.map((p, i) => (
                            <div key={i} style={row}>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                <span style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{p.x},{p.y}</span>
                                <button onClick={() => renamePort(i)} style={iconBtn} title="Rename">✎</button>
                                <button onClick={() => deletePort(i)} style={{ ...iconBtn, color: '#fca5a5' }} title="Delete">✕</button>
                            </div>
                        ))}
                    </Section>

                    <Section title={`Routes (${edges.length})`}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, lineHeight: 1.5 }}>
                            Per hop on a full tank:{' '}
                            <span style={{ color: '#4ade80' }}>all ≤14t</span> ·{' '}
                            <span style={{ color: '#fbbf24' }}>no High-Tech ≤20t</span> ·{' '}
                            <span style={{ color: '#fb923c' }}>Low only ≤33t</span> ·{' '}
                            <span style={{ color: '#f87171' }}>none &gt;33t</span>
                        </div>
                        {edges.map((e, i) => {
                            const t = Math.max(0, e.waypoints.length - 1);
                            const info = tickInfo(t);
                            return (
                                <div key={i} style={row}>
                                    <span style={{ flex: 1, minWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.a} → {e.b}</span>
                                    <span style={{ color: info.color, fontWeight: 700, whiteSpace: 'nowrap' }}
                                          title={`${t} ticks · ${info.fuelHigh}/100 fuel for a High-Tech ship`}>
                                        {t}t · {info.label}
                                    </span>
                                    <button onClick={() => deleteEdge(i)} style={{ ...iconBtn, color: '#fca5a5' }} title="Delete">✕</button>
                                </div>
                            );
                        })}
                    </Section>

                    <Section title="Export — JSON">
                        <textarea readOnly value={jsonText} style={textareaStyle} />
                        <button onClick={() => copy(jsonText)} style={smallBtn}>Copy JSON</button>
                    </Section>
                    <Section title="Export — Java (NavigationDataInitializer)">
                        <textarea readOnly value={javaText} style={textareaStyle} />
                        <button onClick={() => copy(javaText)} style={smallBtn}>Copy Java</button>
                    </Section>
                    <Section title="Import JSON (restore a backup)">
                        <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                                  placeholder='Paste a { "ports": …, "edges": … } JSON here…' style={textareaStyle} />
                        <button onClick={doImport} style={smallBtn}>Load JSON</button>
                    </Section>
                </div>
            </aside>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#7c8aa3' }}>{title}</div>
            {children}
        </div>
    );
}

const modeBtn = (active) => ({
    flex: 1, padding: '7px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700,
    border: '1px solid ' + (active ? '#ffd166' : '#28344e'),
    background: active ? 'rgba(255,209,102,0.15)' : '#0a1120',
    color: active ? '#ffd166' : '#c8d3e6',
});
const smallBtn = {
    padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
    border: '1px solid #28344e', background: '#0a1120', color: '#c8d3e6',
};
const iconBtn = {
    width: 22, height: 22, borderRadius: 5, cursor: 'pointer', fontSize: 12,
    border: '1px solid #28344e', background: '#0a1120', color: '#c8d3e6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const row = {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
    background: '#0a1120', border: '1px solid #1f2c44', borderRadius: 6, padding: '5px 8px',
};
const textareaStyle = {
    width: '100%', height: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 10.5,
    background: '#060b16', color: '#9fb0c8', border: '1px solid #1f2c44', borderRadius: 6, padding: 8,
};
const zoomCtl = {
    width: 34, height: 34, borderRadius: 7, cursor: 'pointer', fontSize: 18, fontWeight: 700, lineHeight: 1,
    border: '1px solid #28344e', background: 'rgba(4,9,15,0.85)', color: '#e8eef5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};
