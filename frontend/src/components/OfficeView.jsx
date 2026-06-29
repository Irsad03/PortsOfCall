import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';
import { ShipStatus, isDocked, isAtSea, isCustomsHold } from '../constants/ShipStatus';
import NewspaperView from './NewspaperView';
import { FocusTrap } from './FocusTrap';

import contractsBackground from '../assets/Office-View/Contracts-background.png';
import highEndShipImg   from '../assets/ships/high-level/High-end-Ship.png';
import normalShipImg    from '../assets/ships/mid-range/mid-range-ship.png';
import lowBudgetShipImg from '../assets/ships/low-end/low-end-ship2.png';
import lowVariantImg    from '../assets/ships/low-end/low-end-ship.png';
import middleVariantImg from '../assets/ships/mid-range/mid-range-ship2.png';
import highVariantImg   from '../assets/ships/high-level/High-end-Ship2.png';

const BG_W = 1536, BG_H = 1024;
const MONITOR_PCT = { leftPct: 15.65, topPct: 19.9, widthPct: 68.8, heightPct: 50 };

function computeBgTransform(vw, vh) {
    const scale = Math.max(vw / BG_W, vh / BG_H);
    const imgW = BG_W * scale, imgH = BG_H * scale;
    return { scale, imgW, imgH, offX: (vw - imgW) / 2, offY: (vh - imgH) / 2 };
}

function computeMonitorRect(vw, vh) {
    const { imgW, imgH, offX, offY } = computeBgTransform(vw, vh);
    return {
        left:   offX + (MONITOR_PCT.leftPct   / 100) * imgW,
        top:    offY + (MONITOR_PCT.topPct    / 100) * imgH,
        width:  (MONITOR_PCT.widthPct  / 100) * imgW,
        height: (MONITOR_PCT.heightPct / 100) * imgH,
    };
}

function useMonitorRect() {
    const [rect, setRect] = useState(() =>
        computeMonitorRect(window.innerWidth, window.innerHeight));
    useEffect(() => {
        const onR = () => setRect(computeMonitorRect(window.innerWidth, window.innerHeight));
        window.addEventListener('resize', onR);
        return () => window.removeEventListener('resize', onR);
    }, []);
    return rect;
}

const COFFEE_PCT = { xPct: 90.8, yPct: 70.1 };
const CUP_OPENING_W = 130;

const STEAM_TOP = 22, STEAM_BOTTOM = 164, STEAM_CENTER_X = 30;
const STEAM_WAVELENGTH = 70;
function steamSinePath(phase) {
    const samples = 24, pts = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const y = STEAM_BOTTOM - t * (STEAM_BOTTOM - STEAM_TOP);
        const amp = 2 + 10 * t;
        const x = STEAM_CENTER_X + amp * Math.sin((2 * Math.PI * (STEAM_BOTTOM - y)) / STEAM_WAVELENGTH + phase);
        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return 'M' + pts.join(' L');
}
const STEAM_PHASES = Array.from({ length: 9 }, (_, i) => steamSinePath(-(i / 8) * 2 * Math.PI));

function CoffeeSteam() {
    const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
    useEffect(() => {
        const onR = () => setVp({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onR);
        return () => window.removeEventListener('resize', onR);
    }, []);
    const { scale, imgW, imgH, offX, offY } = computeBgTransform(vp.w, vp.h);
    const svgW = CUP_OPENING_W * scale * 0.62;
    const svgH = svgW * (170 / 60);
    return (
        <div aria-hidden style={{
            position: 'absolute', zIndex: 2, pointerEvents: 'none',
            left: offX + (COFFEE_PCT.xPct / 100) * imgW,
            top:  offY + (COFFEE_PCT.yPct / 100) * imgH,
        }}>
            <svg width={svgW} height={svgH} viewBox="0 0 60 170"
                style={{ position: 'absolute', left: -svgW / 2, bottom: 0, overflow: 'visible' }}>
                <defs>
                    <linearGradient id="office-steam-grad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0"    stopColor="#e8f3fc" stopOpacity="0.08" />
                        <stop offset="0.16" stopColor="#e8f3fc" stopOpacity="0.85" />
                        <stop offset="0.7"  stopColor="#e8f3fc" stopOpacity="0.65" />
                        <stop offset="1"    stopColor="#e8f3fc" stopOpacity="0" />
                    </linearGradient>
                    <filter id="office-steam-blur" x="-100%" y="-20%" width="300%" height="140%">
                        <feGaussianBlur stdDeviation="1.1" />
                    </filter>
                    <filter id="office-steam-haze" x="-150%" y="-30%" width="400%" height="160%">
                        <feGaussianBlur stdDeviation="2.8" />
                    </filter>
                    <path id="office-steam-path" d={STEAM_PHASES[0]}>
                        <animate attributeName="d" dur="4s" repeatCount="indefinite"
                            values={STEAM_PHASES.join(';')} />
                    </path>
                </defs>
                <g fill="none" stroke="url(#office-steam-grad)" strokeLinecap="round">
                    <use href="#office-steam-path" strokeWidth="13" opacity="0.6" filter="url(#office-steam-haze)" />
                    <use href="#office-steam-path" strokeWidth="7" opacity="1" filter="url(#office-steam-blur)" />
                    <animate attributeName="opacity" dur="4.2s" repeatCount="indefinite"
                        values="0.8;1;0.7;0.95;0.8" />
                </g>
            </svg>
        </div>
    );
}

const SHIP_CLASS_SPRITES = {
    HIGH_TECH_SHIPS:   highEndShipImg,
    MEDIUM_COST_SHIPS: normalShipImg,
    LOW_COST_SHIPS:    lowBudgetShipImg,
};
const SHIP_NAME_SPRITES = {
    'Coastal Runner':      lowVariantImg,
    'Stormrider Clipper':  middleVariantImg,
    'Crown Galleon':       highVariantImg,
    'Salt-Stained Runner': lowVariantImg,
    'Storm-Worn Clipper':  middleVariantImg,
    'Tarnished Galleon':   highVariantImg,
};
function spriteFor(ship) {
    return SHIP_NAME_SPRITES[ship.name] || SHIP_CLASS_SPRITES[ship.shipClass] || normalShipImg;
}
const CLASS_LABELS = { LOW_COST_SHIPS: 'Low-Budget', MEDIUM_COST_SHIPS: 'Normal-Range', HIGH_TECH_SHIPS: 'High-End' };
function classLabel(c) { return CLASS_LABELS[c] ?? c ?? '—'; }

function statusInfo(ship) {
    if (ship.status === ShipStatus.CUSTOMS_HOLD) {
        const cs = ship.customsStatus ?? 'NONE';
        if (cs === 'PENALIZED')  return { label: 'PENALIZED',  fg: '#b91c1c', bg: '#fee2e2', icon: '' };
        if (cs === 'PROCESSING') return { label: 'INSPECTION', fg: '#1d4ed8', bg: '#dbeafe', icon: '' };
        return { label: 'CUSTOMS', fg: '#9a3412', bg: '#ffedd5', icon: '' };
    }
    switch (ship.status) {
        case ShipStatus.IDLE:           return { label: 'DOCKED',  fg: '#15803d', bg: '#dcfce7', icon: '' };
        case ShipStatus.LOADING:        return { label: 'LOADING', fg: '#9a3412', bg: '#ffedd5', icon: '' };
        case ShipStatus.LOADED:         return { label: 'LOADED',  fg: '#92400e', bg: '#fef3c7', icon: '' };
        case ShipStatus.IN_TRANSIT:     return { label: 'AT SEA',  fg: '#1d4ed8', bg: '#dbeafe', icon: '' };
        case ShipStatus.AWAITING_PILOT: return { label: 'PILOT?',  fg: '#a16207', bg: '#fef9c3', icon: '' };
        default:                        return { label: ship.status, fg: '#475569', bg: '#e2e8f0', icon: '•' };
    }
}

function fuelColor(v) { return v > 30 ? '#16a34a' : v > 10 ? '#ea580c' : '#dc2626'; }

function reserveTankPercent(ship) {
    const cap = ship.reserveFuelCapacity ?? 0;
    if (cap <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((ship.reserveFuel ?? 0) / cap * 100)));
}
function hullColor(v) { return v >= 60 ? '#16a34a' : v >= 20 ? '#ea580c' : '#dc2626'; }

const STORAGE_KEY = 'pof:fleet:prefs:v1';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {} };

function useToasts() {
    const [toasts, setToasts] = useState([]);
    const id = useRef(0);
    const push = useCallback((title, msg) => {
        const i = ++id.current;
        setToasts(t => [...t, { id: i, title, msg }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== i)), 2400);
    }, []);
    return [toasts, push];
}

const STATUS_FILTERS = [
    { id: 'all',     label: 'All',     match: () => true },
    { id: 'docked',  label: 'Docked',  match: s => isDocked(s.status) },
    { id: 'at_sea',  label: 'At Sea',  match: s => isAtSea(s.status) },
    { id: 'customs', label: 'Customs', match: s => isCustomsHold(s.status) },
];
const CLASS_FILTERS = [
    { id: 'all',               label: 'All' },
    { id: 'LOW_COST_SHIPS',    label: 'Low' },
    { id: 'MEDIUM_COST_SHIPS', label: 'Medium' },
    { id: 'HIGH_TECH_SHIPS',   label: 'High-Tech' },
];
const SORT_OPTIONS = [
    { id: 'status',   label: 'Status' },
    { id: 'class',    label: 'Class' },
    { id: 'name',     label: 'Name' },
    { id: 'location', label: 'Location' },
    { id: 'fuel',     label: 'Fuel ↑' },
    { id: 'hull',     label: 'Hull ↑' },
];
const STATUS_ORDER = ['IN_TRANSIT','AWAITING_PILOT','LOADING','LOADED','IDLE','CUSTOMS_HOLD'];
const CLASS_ORDER  = ['HIGH_TECH_SHIPS','MEDIUM_COST_SHIPS','LOW_COST_SHIPS'];

export default function OfficeView({ portId, sessionId, myPlayerId, currentPortName, ports, onBack, cargoFocus, newsFocus, newsUnread = 0, onNewsRead }) {
    const { currentTick, updatePlayerState, refreshMyBalance, setSmugglingOffer, activeShips } = useGame();
    const [activeApp, setActiveApp] = useState(cargoFocus ? 'cargo' : (newsFocus ? 'news' : null));
    const [toasts, pushToast] = useToasts();
    const monitor = useMonitorRect();

    const monSty = {
        position: 'absolute',
        left: `${monitor.left}px`, top: `${monitor.top}px`,
        width: `${monitor.width}px`, height: `${monitor.height}px`,
    };

    return createPortal(
        <FocusTrap style={{ position: 'fixed', inset: 0, background: '#0a1525', overflow: 'hidden', zIndex: 900 }}>
            <img src={contractsBackground} alt="" draggable={false} style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                imageRendering: 'pixelated', userSelect: 'none', pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 70%, rgba(4,9,21,0.6) 100%)',
            }} />

            <CoffeeSteam />

            <header style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', zIndex: 10,
                background: 'linear-gradient(to bottom, rgba(4,9,15,0.65), rgba(4,9,15,0))',
                pointerEvents: 'none',
            }}>
                <button onClick={onBack} aria-label="Back" title="Back" style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '1px solid rgba(200,154,32,0.4)',
                    background: 'rgba(4,9,15,0.72)', color: '#fff',
                    fontSize: 20, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(6px)', boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    pointerEvents: 'auto', transition: 'background 0.15s ease',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(180,40,40,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(4,9,15,0.72)'}
                >X</button>
                <h3 style={{
                    margin: 0, color: '#e8f2ff',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase',
                    textShadow: '0 2px 8px rgba(0,0,0,0.85)', fontWeight: 400,
                }}>
                    Office — {currentPortName}
                </h3>
                <div style={{ width: 40 }} />
            </header>

            <MonitorScreen
                style={monSty}
                activeApp={activeApp}
                onLaunch={setActiveApp}
                onClose={() => setActiveApp(null)}
                onPowerOff={onBack}
                portId={portId}
                sessionId={sessionId}
                myPlayerId={myPlayerId}
                currentPortName={currentPortName}
                ports={ports}
                currentTick={currentTick}
                activeShips={activeShips}
                updatePlayerState={updatePlayerState}
                refreshMyBalance={refreshMyBalance}
                setSmugglingOffer={setSmugglingOffer}
                pushToast={pushToast}
                onAcceptedCargo={onBack}
                focusContractId={cargoFocus?.contractId ?? null}
                focusShipId={cargoFocus?.shipId ?? null}
                focusNewsHeadline={newsFocus?.headline ?? null}
                newsUnread={newsUnread}
                onNewsRead={onNewsRead}
            />

            <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{
                        background: 'rgba(4,8,18,0.95)', border: '1px solid #c89a20',
                        color: '#c8dcf0', padding: '10px 14px',
                        boxShadow: '4px 4px 0 rgba(0,0,0,0.55)',
                        fontSize: 12, animation: 'toastIn 0.2s ease-out',
                    }}>
                        <strong style={{ color: '#e8b830', fontWeight: 400, fontSize: '0.7rem', letterSpacing: '1.5px', display: 'block', marginBottom: 4 }}>{t.title}</strong>
                        {t.msg}
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes toastIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
                @keyframes hotspotPulse { 0%,100%{color:rgba(180,220,255,0)} 50%{color:rgba(180,220,255,0.7)} }
                button:hover .hotspot-prompt { color:rgba(180,220,255,0.9)!important; }
                button .hotspot-prompt { animation:hotspotPulse 2s ease-in-out infinite; }
                @keyframes crtPowerOn { 0%{opacity:0;transform:scale(0.98);filter:brightness(2.2)} 40%{opacity:1;filter:brightness(1.5)} 100%{opacity:1;transform:scale(1);filter:brightness(1)} }
                @keyframes appIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes startMenuIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shipBob { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-50%,calc(-50% - 2px))} }
                @keyframes shipBobCenter { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
                .office-ship-card:hover { transform:translateY(-1px);border-color:#2878d0!important;box-shadow:0 4px 12px rgba(20,40,80,0.12)!important; }
                .office-quick-actions {
                    position:absolute;left:4px;right:4px;bottom:4px;
                    display:grid;grid-template-columns:repeat(3,1fr);gap:3px;
                    opacity:0;transform:translateY(4px);
                    transition:opacity 0.15s ease,transform 0.15s ease;
                    pointer-events:none;z-index:4;
                }
                .office-ship-card:hover .office-quick-actions,
                .office-ship-card:focus-within .office-quick-actions { opacity:1;transform:translateY(0);pointer-events:auto; }
            `}</style>
        </FocusTrap>,
        document.body,
    );
}

function MonitorScreen({ style, activeApp, onLaunch, onClose, onPowerOff, portId, sessionId, myPlayerId, currentPortName, ports, currentTick, activeShips, updatePlayerState, refreshMyBalance, setSmugglingOffer, pushToast, onAcceptedCargo, focusContractId, focusShipId, focusNewsHeadline, newsUnread, onNewsRead }) {
    return (
        <div style={{
            ...style, zIndex: 5, overflow: 'hidden',
            background: '#ffffff', color: '#0f172a',
            fontFamily: "'Inter', system-ui, sans-serif",
            boxShadow: 'inset 0 0 40px rgba(40,100,180,0.08), inset 0 0 4px rgba(255,255,255,0.9), 0 0 24px rgba(60,130,200,0.35)',
            animation: 'crtPowerOn 0.35s ease-out',
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                background: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.025) 0px,rgba(0,0,0,0.025) 1px,transparent 1px,transparent 3px)',
            }} />
            {activeApp === null && <Desktop onLaunch={onLaunch} onPowerOff={onPowerOff} newsUnread={newsUnread} />}
            {activeApp === 'fleet' && (
                <FleetInMonitor myPlayerId={myPlayerId} ports={ports} currentTick={currentTick} activeShips={activeShips} refreshMyBalance={refreshMyBalance} updatePlayerState={updatePlayerState} setSmugglingOffer={setSmugglingOffer} pushToast={pushToast} onClose={onClose} />
            )}
            {activeApp === 'cargo' && (
                <CargoInMonitor portId={portId} sessionId={sessionId} myPlayerId={myPlayerId} currentPortName={currentPortName} ports={ports} currentTick={currentTick} updatePlayerState={updatePlayerState} pushToast={pushToast} onClose={onClose} onAccepted={onAcceptedCargo} focusContractId={focusContractId} focusShipId={focusShipId} />
            )}
            {activeApp === 'finances' && (
                <FinancesInMonitor myPlayerId={myPlayerId} currentTick={currentTick} refreshMyBalance={refreshMyBalance} pushToast={pushToast} onClose={onClose} />
            )}
            {activeApp === 'news' && (
                <NewspaperView
                    sessionId={sessionId}
                    currentTick={currentTick}
                    focusHeadline={focusNewsHeadline}
                    onRead={onNewsRead}
                    onClose={onClose}
                />
            )}
            <Taskbar activeApp={activeApp} onLaunch={onLaunch} onPowerOff={onPowerOff} newsUnread={newsUnread} />
        </div>
    );
}

const RATING_COLOR = { 'S+': '#d4af37', A: '#16a34a', B: '#2878d0', C: '#d97706', D: '#dc2626', E: '#991b1b' };
const LOAN_STATUS = {
    ACTIVE:    { label: 'ACTIVE',    fg: '#15803d', bg: '#dcfce7' },
    OVERDUE:   { label: 'OVERDUE',   fg: '#b91c1c', bg: '#fee2e2' },
    PAID_OFF:  { label: 'PAID OFF',  fg: '#475569', bg: '#e2e8f0' },
    DEFAULTED: { label: 'DEFAULTED', fg: '#7f1d1d', bg: '#fecaca' },
    SEIZED:    { label: 'SEIZED',    fg: '#7f1d1d', bg: '#fecaca' },
};
const TX_META = {
    DISBURSEMENT: { label: 'Disbursement', color: '#15803d', sign: '+' },
    INSTALLMENT:  { label: 'Instalment',   color: '#b45309', sign: '−' },
    PENALTY:      { label: 'Penalty',      color: '#b91c1c', sign: '+' },
    PAYOFF:       { label: 'Payoff',       color: '#b45309', sign: '−' },
    SEIZURE:      { label: 'Seizure',      color: '#7f1d1d', sign: '' },
};
const eur = (n) => `${Math.round(n ?? 0).toLocaleString()}🪙`;

function FinancesInMonitor({ myPlayerId, currentTick, refreshMyBalance, pushToast, onClose }) {
    const [tab, setTab]           = useState('overview');
    const [overview, setOverview] = useState(null);
    const [loans, setLoans]       = useState([]);
    const [mortgages, setMortgages] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [history, setHistory]   = useState({});
    const [busyLoan, setBusyLoan] = useState(null);
    const [expandedM, setExpandedM] = useState(null);
    const [historyM, setHistoryM]   = useState({});
    const [busyMortgage, setBusyMortgage] = useState(null);

    const loadAll = useCallback(async () => {
        if (!myPlayerId) return;
        setLoading(true); setError(null);
        try {
            const [ov, ls, ms] = await Promise.all([
                gameService.getBankOverview(myPlayerId),
                gameService.getLoans(myPlayerId),
                gameService.getMortgages(myPlayerId),
            ]);
            setOverview(ov);
            setLoans(ls);
            setMortgages(ms);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [myPlayerId]);

    useEffect(() => { loadAll(); }, [loadAll, currentTick]);

    async function toggleHistory(loanId) {
        if (expanded === loanId) { setExpanded(null); return; }
        setExpanded(loanId);
        if (!history[loanId]) {
            try {
                const h = await gameService.getLoanHistory(loanId);
                setHistory(prev => ({ ...prev, [loanId]: h }));
            } catch (err) { pushToast('Error', err.message); }
        }
    }

    async function handleRepay(loan, kind) {
        setBusyLoan(loan.id);
        try {
            if (kind === 'payoff') await gameService.payOffLoan(loan.id, currentTick);
            else                   await gameService.payLoanInstallment(loan.id, currentTick);
            if (refreshMyBalance) await refreshMyBalance(myPlayerId);
            pushToast(kind === 'payoff' ? 'Loan paid off' : 'Instalment paid',
                kind === 'payoff' ? 'Balance settled in full.' : `Paid ${eur(loan.tickPayment)}.`);
            setHistory(prev => { const n = { ...prev }; delete n[loan.id]; return n; });
            await loadAll();
        } catch (err) { pushToast('Error', err.message); }
        finally { setBusyLoan(null); }
    }

    async function toggleHistoryM(mortgageId) {
        if (expandedM === mortgageId) { setExpandedM(null); return; }
        setExpandedM(mortgageId);
        if (!historyM[mortgageId]) {
            try {
                const h = await gameService.getMortgageHistory(mortgageId);
                setHistoryM(prev => ({ ...prev, [mortgageId]: h }));
            } catch (err) { pushToast('Error', err.message); }
        }
    }

    async function handleRepayMortgage(mortgage, kind) {
        setBusyMortgage(mortgage.id);
        try {
            if (kind === 'payoff') await gameService.payOffMortgage(mortgage.id, currentTick);
            else                   await gameService.payMortgageInstallment(mortgage.id, currentTick);
            if (refreshMyBalance) await refreshMyBalance(myPlayerId);
            pushToast(kind === 'payoff' ? 'Mortgage paid off' : 'Instalment paid',
                kind === 'payoff' ? `Lien on ${mortgage.shipName} released.` : `Paid ${eur(mortgage.tickPayment)}.`);
            setHistoryM(prev => { const n = { ...prev }; delete n[mortgage.id]; return n; });
            await loadAll();
        } catch (err) { pushToast('Error', err.message); }
        finally { setBusyMortgage(null); }
    }

    const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE' || l.status === 'DEFAULTED');
    const activeMortgages = mortgages.filter(m => m.status === 'ACTIVE' || m.status === 'OVERDUE');

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f6f9', position: 'relative', zIndex: 3, minHeight: 0, animation: 'appIn 0.22s ease-out' }}>
            <AppTitleBar icon="" title="Finances" color="#16a34a" onClose={onClose} />

            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#eef2f7', borderBottom: '1px solid #c4d0de', flexShrink: 0 }}>
                <FinTab active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</FinTab>
                <FinTab active={tab === 'loans'} onClick={() => setTab('loans')}>
                    Loans{activeLoans.length > 0 && <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 8, padding: '0 6px', fontSize: 10 }}>{activeLoans.length}</span>}
                </FinTab>
                <FinTab active={tab === 'mortgages'} onClick={() => setTab('mortgages')}>
                    Mortgages{activeMortgages.length > 0 && <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 8, padding: '0 6px', fontSize: 10 }}>{activeMortgages.length}</span>}
                </FinTab>
                <div style={{ flex: 1 }} />
                <button onClick={loadAll} disabled={loading} title="Refresh" style={{ height: 28, padding: '0 10px', background: '#fff', border: '1px solid #c4d0de', borderRadius: 4, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', color: '#3d5a7a' }}>⟳</button>
            </div>

            {error && <div style={{ background: '#fde2e2', color: '#a11b1b', padding: '6px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>! {error}</div>}

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 12 }}>
                {tab === 'overview' && <OverviewPane overview={overview} loading={loading} loans={loans} mortgages={mortgages} />}
                {tab === 'loans' && (
                    <LoansPane
                        loans={loans} loading={loading}
                        expanded={expanded} history={history} busyLoan={busyLoan}
                        onToggleHistory={toggleHistory} onRepay={handleRepay} />
                )}
                {tab === 'mortgages' && (
                    <MortgagesPane
                        mortgages={mortgages} loading={loading}
                        expanded={expandedM} history={historyM} busyMortgage={busyMortgage}
                        onToggleHistory={toggleHistoryM} onRepay={handleRepayMortgage} />
                )}
            </div>
        </div>
    );
}

function FinTab({ active, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            height: 28, padding: '0 14px', borderRadius: 4, cursor: 'pointer',
            background: active ? '#fff' : 'transparent',
            border: '1px solid ' + (active ? '#16a34a' : 'transparent'),
            color: active ? '#15803d' : '#475569', fontSize: 12, fontWeight: 700,
            boxShadow: active ? 'inset 0 -2px 0 #16a34a' : 'none',
            display: 'flex', alignItems: 'center',
        }}>{children}</button>
    );
}

function OverviewPane({ overview, loading, loans, mortgages = [] }) {
    if (loading && !overview) return <div style={finEmpty}>Loading finances…</div>;
    if (!overview) return <div style={finEmpty}>No financial data.</div>;

    const ratingColor = RATING_COLOR[overview.creditRating] ?? '#475569';
    const activeDebt = loans
        .filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE' || l.status === 'DEFAULTED')
        .reduce((s, l) => s + (l.remainingBalance ?? 0), 0);
    const mortgageDebt = mortgages
        .filter(m => m.status === 'ACTIVE' || m.status === 'OVERDUE')
        .reduce((s, m) => s + (m.remainingBalance ?? 0), 0);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            <KpiCard label="Cash Balance" value={eur(overview.cash)} color="#c89a20" />
            <KpiCard label="Net Worth" value={eur(overview.netWorth)} color={overview.netWorth >= 0 ? '#16a34a' : '#dc2626'} />
            <KpiCard label="Total Debt" value={overview.totalDebt > 0 ? eur(overview.totalDebt) : 'No debt'} color={overview.totalDebt > 0 ? '#dc2626' : '#16a34a'} />
            <KpiCard label="Outstanding Loans" value={activeDebt > 0 ? eur(activeDebt) : '—'} color="#0f172a" />
            <KpiCard label="Outstanding Mortgages" value={mortgageDebt > 0 ? eur(mortgageDebt) : '—'} color="#0f172a" />
            <div style={{ ...finCard, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: ratingColor, border: `2px solid ${ratingColor}`, borderRadius: 10, padding: '6px 16px', background: ratingColor + '18' }}>
                    {overview.creditRating}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>Credit Rating</div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
                        <div style={{ width: `${Math.min(100, (overview.creditScore / 1000) * 100)}%`, height: '100%', background: ratingColor }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{overview.creditScore} / 1000 pts</div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, color }) {
    return (
        <div style={finCard}>
            <div style={{ fontSize: 10.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
        </div>
    );
}

function LoansPane({ loans, loading, expanded, history, busyLoan, onToggleHistory, onRepay }) {
    if (loading && loans.length === 0) return <div style={finEmpty}>Loading loans…</div>;
    if (loans.length === 0) return <div style={finEmpty}>You have no loans. Visit the bank to take one out.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loans.map(loan => {
                const st = LOAN_STATUS[loan.status] ?? LOAN_STATUS.ACTIVE;
                const repayable = loan.totalRepayable || 1;
                const paidPct = Math.min(100, Math.max(0, Math.round((1 - loan.remainingBalance / repayable) * 100)));
                const payable = loan.status === 'ACTIVE' || loan.status === 'OVERDUE' || loan.status === 'DEFAULTED';
                const busy = busyLoan === loan.id;
                const open = expanded === loan.id;
                return (
                    <div key={loan.id} style={finCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ background: st.bg, color: st.fg, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{st.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{eur(loan.principal)} loan</span>
                            <span style={{ flex: 1 }} />
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 9.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Remaining</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: loan.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>{eur(loan.remainingBalance)}</div>
                            </div>
                        </div>

                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ width: `${paidPct}%`, height: '100%', background: '#16a34a', transition: 'width 0.4s ease' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '6px 12px', fontSize: 12 }}>
                            <Stat label="Interest" value={`${(loan.interestRate * 100).toFixed(1)} %`} />
                            <Stat label="Per day" value={eur(loan.tickPayment)} />
                            <Stat label="Due day" value={loan.dueTick} />
                            <Stat label="Origination" value={`day ${loan.originationTick}`} />
                            <Stat label="Payments made" value={loan.paymentsMadeCount} />
                            <Stat label="Interest paid" value={eur(loan.totalInterestPaid)} />
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            {payable && (
                                <>
                                    <FinBtn onClick={() => onRepay(loan, 'pay')} disabled={busy} primary>
                                        {busy ? '…' : `Pay rate (${eur(loan.tickPayment)})`}
                                    </FinBtn>
                                    <FinBtn onClick={() => onRepay(loan, 'payoff')} disabled={busy}>
                                        {busy ? '…' : `Pay off (${eur(loan.remainingBalance)})`}
                                    </FinBtn>
                                </>
                            )}
                            <FinBtn onClick={() => onToggleHistory(loan.id)}>{open ? 'Hide history' : 'History'}</FinBtn>
                        </div>

                        {open && (
                            <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                                {!history[loan.id] ? (
                                    <div style={{ fontSize: 12, color: '#64748b' }}>Loading history…</div>
                                ) : history[loan.id].length === 0 ? (
                                    <div style={{ fontSize: 12, color: '#64748b' }}>No transactions yet.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                        <thead>
                                            <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                                <th style={finTh}>Day</th><th style={finTh}>Type</th>
                                                <th style={{ ...finTh, textAlign: 'right' }}>Amount</th>
                                                <th style={{ ...finTh, textAlign: 'right' }}>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history[loan.id].map(tx => {
                                                const m = TX_META[tx.type] ?? { label: tx.type, color: '#475569', sign: '' };
                                                return (
                                                    <tr key={tx.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={finTd}>{tx.tick}</td>
                                                        <td style={{ ...finTd, color: m.color, fontWeight: 600 }}>{m.label}</td>
                                                        <td style={{ ...finTd, textAlign: 'right', color: m.color }}>{m.sign} {eur(tx.amount)}</td>
                                                        <td style={{ ...finTd, textAlign: 'right' }}>{eur(tx.balanceAfter)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function MortgagesPane({ mortgages, loading, expanded, history, busyMortgage, onToggleHistory, onRepay }) {
    if (loading && mortgages.length === 0) return <div style={finEmpty}>Loading mortgages…</div>;
    if (mortgages.length === 0) return <div style={finEmpty}>You have no mortgages. Visit the bank to mortgage a ship.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mortgages.map(m => {
                const st = LOAN_STATUS[m.status] ?? LOAN_STATUS.ACTIVE;
                const repayable = m.totalRepayable || 1;
                const paidPct = Math.min(100, Math.max(0, Math.round((1 - m.remainingBalance / repayable) * 100)));
                const payable = m.status === 'ACTIVE' || m.status === 'OVERDUE';
                const busy = busyMortgage === m.id;
                const open = expanded === m.id;
                return (
                    <div key={m.id} style={finCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ background: st.bg, color: st.fg, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{st.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{m.shipName}</span>
                            <span style={{ flex: 1 }} />
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 9.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Remaining</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: m.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>{eur(m.remainingBalance)}</div>
                            </div>
                        </div>

                        {m.status === 'SEIZED' && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                The bank repossessed {m.shipName} after too many missed payments.
                            </div>
                        )}

                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ width: `${paidPct}%`, height: '100%', background: '#16a34a', transition: 'width 0.4s ease' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '6px 12px', fontSize: 12 }}>
                            <Stat label="Borrowed" value={eur(m.principal)} />
                            <Stat label="Ship value" value={eur(m.shipValue)} />
                            <Stat label="Interest" value={`${(m.interestRate * 100).toFixed(1)} %`} />
                            <Stat label="Per day" value={eur(m.tickPayment)} />
                            <Stat label="Due day" value={m.dueTick} />
                            <Stat label="Payments made" value={m.paymentsMadeCount} />
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            {payable && (
                                <>
                                    <FinBtn onClick={() => onRepay(m, 'pay')} disabled={busy} primary>
                                        {busy ? '…' : `Pay rate (${eur(m.tickPayment)})`}
                                    </FinBtn>
                                    <FinBtn onClick={() => onRepay(m, 'payoff')} disabled={busy}>
                                        {busy ? '…' : `Pay off (${eur(m.remainingBalance)})`}
                                    </FinBtn>
                                </>
                            )}
                            <FinBtn onClick={() => onToggleHistory(m.id)}>{open ? 'Hide history' : 'History'}</FinBtn>
                        </div>

                        {open && (
                            <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                                {!history[m.id] ? (
                                    <div style={{ fontSize: 12, color: '#64748b' }}>Loading history…</div>
                                ) : history[m.id].length === 0 ? (
                                    <div style={{ fontSize: 12, color: '#64748b' }}>No transactions yet.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                        <thead>
                                            <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                                <th style={finTh}>Day</th><th style={finTh}>Type</th>
                                                <th style={{ ...finTh, textAlign: 'right' }}>Amount</th>
                                                <th style={{ ...finTh, textAlign: 'right' }}>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history[m.id].map(tx => {
                                                const meta = TX_META[tx.type] ?? { label: tx.type, color: '#475569', sign: '' };
                                                return (
                                                    <tr key={tx.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={finTd}>{tx.tick}</td>
                                                        <td style={{ ...finTd, color: meta.color, fontWeight: 600 }}>{meta.label}</td>
                                                        <td style={{ ...finTd, textAlign: 'right', color: meta.color }}>{meta.sign} {eur(tx.amount)}</td>
                                                        <td style={{ ...finTd, textAlign: 'right' }}>{eur(tx.balanceAfter)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <span style={{ color: '#64748b' }}>{label}: </span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{value}</span>
        </div>
    );
}

function FinBtn({ children, onClick, primary, disabled }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{
            padding: '6px 10px', borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer',
            border: '1px solid ' + (primary ? '#16a34a' : '#c4d0de'),
            background: primary ? '#16a34a' : '#fff',
            color: primary ? '#fff' : '#3d5a7a',
            fontSize: 11.5, fontWeight: 700, opacity: disabled ? 0.55 : 1,
        }}>{children}</button>
    );
}

const finCard = { background: '#fff', border: '1px solid #d8e0ea', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(20,40,80,0.06)' };
const finEmpty = { textAlign: 'center', padding: 40, color: '#64748b', background: '#fff', border: '1px dashed #c4d0de', borderRadius: 8, fontSize: 14, fontWeight: 600 };
const finTh = { padding: '4px 6px', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4 };
const finTd = { padding: '4px 6px', color: '#334155' };

function UnreadBadge({ count, size = 22, fontSize = 11 }) {
    if (!count || count <= 0) return null;
    return (
        <span style={{
            position: 'absolute', top: -6, right: -6,
            minWidth: size, height: size, padding: '0 5px',
            borderRadius: size / 2, background: '#dc2626', color: '#fff',
            fontSize, fontWeight: 800, lineHeight: `${size}px`,
            textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            border: '2px solid #fff', boxSizing: 'border-box',
        }}>
            {count > 24 ? '25+' : count}
        </span>
    );
}

function Desktop({ onLaunch, onPowerOff, newsUnread = 0 }) {
    return (
        <div style={{
            flex: 1, position: 'relative',
            background: 'radial-gradient(circle at 30% 20%,#eef4fb 0%,#f5f7fa 40%,#e9eef5 100%)',
            overflow: 'hidden', zIndex: 3, animation: 'appIn 0.22s ease-out',
        }}>
            <div style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 40, position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, calc(-50% - 20px))',
            }}>
                <DesktopIcon label="Cargo Market" onClick={() => onLaunch('cargo')} background="linear-gradient(135deg,#4ea3f0 0%,#2878d0 100%)">
                    <svg viewBox="0 0 64 64" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
                        <path d="M32 8 L56 20 L32 32 L8 20 Z" fill="rgba(255,255,255,0.15)" />
                        <path d="M8 20 L8 44 L32 56 L56 44 L56 20" />
                        <line x1="32" y1="32" x2="32" y2="56" />
                        <line x1="20" y1="14" x2="44" y2="26" opacity="0.6" />
                    </svg>
                </DesktopIcon>
                <DesktopIcon label="My Fleet" onClick={() => onLaunch('fleet')} background="linear-gradient(135deg,#e8b830 0%,#c89a20 100%)">
                    <svg viewBox="0 0 64 64" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
                        <circle cx="32" cy="14" r="5" />
                        <line x1="32" y1="19" x2="32" y2="52" />
                        <line x1="22" y1="26" x2="42" y2="26" />
                        <path d="M12 38 C 14 50, 24 56, 32 56 C 40 56, 50 50, 52 38" />
                        <line x1="6" y1="40" x2="14" y2="36" />
                        <line x1="58" y1="40" x2="50" y2="36" />
                    </svg>
                </DesktopIcon>
                <DesktopIcon label="Finances" onClick={() => onLaunch('finances')} background="linear-gradient(135deg,#34d399 0%,#16a34a 100%)">
                    <svg viewBox="0 0 64 64" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
                        <line x1="10" y1="54" x2="54" y2="54" />
                        <rect x="14" y="34" width="8" height="18" />
                        <rect x="28" y="24" width="8" height="28" />
                        <rect x="42" y="14" width="8" height="38" />
                    </svg>
                </DesktopIcon>
                <DesktopIcon label="News" onClick={() => onLaunch('news')} background="linear-gradient(135deg,#c8a44e 0%,#8a6d3b 100%)" badge={newsUnread}>
                    <svg viewBox="0 0 64 64" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
                        <path d="M12 14 H46 V50 H16 C13.8 50 12 48.2 12 46 Z" fill="rgba(255,255,255,0.12)" />
                        <path d="M46 22 H52 V46 C52 48.2 50.2 50 48 50 H46" />
                        <line x1="18" y1="22" x2="40" y2="22" />
                        <rect x="18" y="28" width="9" height="9" />
                        <line x1="31" y1="29" x2="40" y2="29" />
                        <line x1="31" y1="33" x2="40" y2="33" />
                        <line x1="18" y1="42" x2="40" y2="42" />
                    </svg>
                </DesktopIcon>
            </div>
            <div style={{
                position: 'absolute', bottom: 56, right: 16,
                color: 'rgba(60,90,130,0.35)', fontFamily: "'Press Start 2P',monospace",
                fontSize: '0.42rem', letterSpacing: '2px', textTransform: 'uppercase',
                pointerEvents: 'none', textAlign: 'right', lineHeight: 1.6,
            }}>Ports of Call OS<br />v1.0</div>
        </div>
    );
}

function DesktopIcon({ label, onClick, background, badge = 0, children }) {
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover ? 'rgba(40,120,208,0.1)' : 'transparent',
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, padding: '10px 14px', outline: 'none', borderRadius: 8,
            transform: hover ? 'scale(1.03)' : 'scale(1)',
            transition: 'background 0.15s ease, transform 0.15s ease',
        }}>
            <div style={{
                width: 80, height: 80, background, borderRadius: 12, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: hover
                    ? '0 8px 24px rgba(40,80,140,0.32), 0 0 0 1px rgba(255,255,255,0.18) inset'
                    : '0 4px 12px rgba(40,80,140,0.22), 0 0 0 1px rgba(255,255,255,0.18) inset',
                transition: 'box-shadow 0.18s ease',
            }}>{children}<UnreadBadge count={badge} /></div>
            <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>{label}</span>
        </button>
    );
}

function Taskbar({ activeApp, onLaunch, onPowerOff, newsUnread = 0 }) {
    const [startOpen, setStartOpen] = useState(false);
    const [time, setTime] = useState(new Date());
    const menuRef = useRef(null);
    const btnRef  = useRef(null);

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!startOpen) return;
        const onDown = e => {
            if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            setStartOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => { document.removeEventListener('mousedown', onDown); };
    }, [startOpen]);

    return (
        <div style={{
            flex: '0 0 40px', background: 'linear-gradient(to bottom,#f1f5f9,#e2e8f0)',
            borderTop: '1px solid #c4d0de',
            display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, zIndex: 4, position: 'relative',
        }}>
            <button ref={btnRef} onClick={() => setStartOpen(o => !o)} style={{
                height: 28, padding: '0 10px',
                background: startOpen ? 'linear-gradient(to bottom,#2878d0,#1d5fa8)' : '#fff',
                border: '1px solid ' + (startOpen ? '#1d5fa8' : '#c4d0de'),
                borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, color: startOpen ? '#fff' : '#3d5a7a',
                cursor: 'pointer', transition: 'background 0.12s ease, color 0.12s ease',
            }}>
                PoC OS
            </button>

            <TaskbarTile active={activeApp === 'cargo'} onClick={() => onLaunch('cargo')} label="Cargo Market" color="#2878d0" />
            <TaskbarTile active={activeApp === 'fleet'} onClick={() => onLaunch('fleet')} label="My Fleet" color="#c89a20" />
            <TaskbarTile active={activeApp === 'finances'} onClick={() => onLaunch('finances')} label="Finances" color="#16a34a" />
            <TaskbarTile active={activeApp === 'news'} onClick={() => onLaunch('news')} label="News" color="#8a6d3b" badge={newsUnread} />

            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, padding: '0 8px' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {startOpen && (
                <div ref={menuRef} style={{
                    position: 'absolute', left: 8, bottom: 44, width: 240,
                    background: '#fff', border: '1px solid #94a3b8', borderRadius: 6,
                    boxShadow: '0 10px 30px rgba(20,40,80,0.28)', zIndex: 20,
                    overflow: 'hidden', animation: 'startMenuIn 0.16s ease-out',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ background: 'linear-gradient(to right,#1d5fa8,#2878d0)', color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Captain</span>
                            <span style={{ fontSize: 10, opacity: 0.8 }}>Ports of Call OS</span>
                        </div>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                        <StartMenuItem label="Cargo Market" hint="Browse freight contracts" onClick={() => { setStartOpen(false); onLaunch('cargo'); }} />
                        <StartMenuItem label="My Fleet" hint="Manage owned ships" onClick={() => { setStartOpen(false); onLaunch('fleet'); }} />
                        <StartMenuItem label="Finances" hint="Overview & loans" onClick={() => { setStartOpen(false); onLaunch('finances'); }} />
                        <StartMenuItem label="News" hint="The Harbour Gazette" onClick={() => { setStartOpen(false); onLaunch('news'); }} />
                    </div>
                    <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                    <div style={{ padding: '6px 0 8px' }}>
                        <StartMenuItem label="Shut Down" hint="Power off the PC" danger onClick={() => { setStartOpen(false); onPowerOff(); }} />
                    </div>
                </div>
            )}
        </div>
    );
}

function StartMenuItem({ label, hint, onClick, danger }) {
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px',
            background: hover ? (danger ? '#fee2e2' : '#eef4fb') : 'transparent',
            border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s ease',
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: danger ? '#b91c1c' : '#0f172a' }}>{label}</span>
                <span style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hint}</span>
            </div>
        </button>
    );
}

function TaskbarTile({ active, onClick, label, color, badge = 0 }) {
    return (
        <button onClick={onClick} style={{
            height: 28, padding: '0 10px', position: 'relative',
            background: active ? '#fff' : 'transparent',
            border: active ? '1px solid ' + color : '1px solid transparent',
            borderRadius: 4, color: active ? color : '#475569',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            boxShadow: active ? `inset 0 -2px 0 ${color}` : 'none',
            transition: 'background 0.12s ease',
        }}>
            {label}
            <UnreadBadge count={badge} size={16} fontSize={9} />
        </button>
    );
}

function AppTitleBar({ icon, title, color, onClose }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px 8px 14px',
            background: `linear-gradient(to bottom,${color},${color}dd)`,
            color: '#fff', borderBottom: '1px solid rgba(0,0,0,0.18)',
            zIndex: 3, position: 'relative', flexShrink: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{title}</span>
            </div>
            <button onClick={onClose} style={{
                width: 26, height: 26, border: 'none',
                background: 'rgba(255,255,255,0.18)', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >X</button>
        </div>
    );
}

const FUEL_PRICE_PER_UNIT = 10;
const REPAIR_COST_PER_HP  = 125;

function voyageProgressFor(shipId, activeShips) {
    const live = activeShips?.find(s => s.shipId === shipId || s.id === shipId);
    const wps  = live?.activeRouteWaypoints;
    if (!wps || wps.length < 2) return 0;
    const idx = live.currentWaypointIndex ?? 0;
    return Math.min(100, Math.max(0, Math.round((idx / (wps.length - 1)) * 100)));
}

function FleetInMonitor({ myPlayerId, ports, currentTick, activeShips, refreshMyBalance, updatePlayerState, setSmugglingOffer, pushToast, onClose }) {
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detailShip, setDetailShip] = useState(null);
    const [sellTarget, setSellTarget] = useState(null);
    const [selling, setSelling] = useState(false);
    const prefs = loadPrefs();
    const [statusFilter,   setStatusFilter]   = useState(prefs.statusFilter   || 'all');
    const [classFilter,    setClassFilter]    = useState(prefs.classFilter    || 'all');
    const [locationFilter, setLocationFilter] = useState(prefs.locationFilter || 'all');
    const [sortBy,         setSortBy]         = useState(prefs.sortBy         || 'status');

    useEffect(() => { savePrefs({ statusFilter, classFilter, locationFilter, sortBy }); }, [statusFilter, classFilter, locationFilter, sortBy]);
    useEffect(() => { refreshFleet(); }, [myPlayerId, currentTick]);

    async function refreshFleet() {
        if (!myPlayerId) return;
        setError(null);
        try {
            const data = await gameService.getFleet(myPlayerId);
            setFleet(data);
            setDetailShip(prev => prev ? (data.find(s => s.id === prev.id) ?? null) : null);
            return data;
        } catch (err) { setError(err.message); }
    }

    async function loadFleet() {
        if (!myPlayerId) return;
        setLoading(true);
        try { await refreshFleet(); }
        finally { setLoading(false); }
    }

    async function reloadAndSync() {
        return refreshFleet();
    }

    async function handleAction(action, ship) {
        try {
            if (action === 'refuel') {
                await gameService.refuelShip(myPlayerId, ship.id);
                if (refreshMyBalance) await refreshMyBalance();
                pushToast('Refuelled', `${ship.name} topped up.`);
                reloadAndSync();
            } else if (action === 'repair') {
                await gameService.repairShip(myPlayerId, ship.id);
                if (refreshMyBalance) await refreshMyBalance();
                pushToast('Repaired', `${ship.name} hull restored.`);
                reloadAndSync();
            } else if (action === 'sell') {
                if (ship.mortgaged || ship.status === 'SEIZED') {
                    pushToast('Cannot sell', `${ship.name} is mortgaged — pay off the mortgage at the bank first.`);
                } else {
                    setSellTarget(ship);
                }
            } else if (action === 'sail') {
                const { destinationPortId } = ship;
                if (!destinationPortId) { pushToast('No destination', 'Pick a destination port first.'); return; }
                setLoading(true);
                const response = await gameService.startRoute({
                    playerId: myPlayerId,
                    shipId: ship.id,
                    destinationPortId,
                });
                if (response?.pendingSmugglingOffer) {
                    setSmugglingOffer?.({
                        offer: response.pendingSmugglingOffer,
                        shipId: ship.id,
                        playerId: myPlayerId,
                        destinationPortName: response.destinationPortName
                            ?? ports.find(p => p.id === destinationPortId)?.name ?? destinationPortId,
                    });
                    setDetailShip(null);
                    return;
                }
                updatePlayerState?.(myPlayerId, { shipStatus: ShipStatus.IN_TRANSIT });
                pushToast('Set Sail', `${ship.name} is heading out.`);
                setDetailShip(null);
                reloadAndSync();
            }
        } catch (err) { pushToast('Error', err.message); }
        finally { setLoading(false); }
    }

    async function confirmSell() {
        if (!sellTarget) return;
        const ship = sellTarget;
        setSelling(true);
        try {
            const result = await gameService.sellShip(myPlayerId, ship.id);
            setSellTarget(null);
            setDetailShip(prev => prev?.id === ship.id ? null : prev);
            if (refreshMyBalance) await refreshMyBalance();
            await reloadAndSync();
            pushToast('Ship sold', `${ship.name} sold for ${(result?.salePrice ?? 0).toLocaleString()}🪙.`);
        } catch (err) {
            pushToast('Sale failed', err.message);
        } finally {
            setSelling(false);
        }
    }

    const portList = useMemo(() =>
        Array.from(new Map(fleet.map(s => [s.currentPortId, ports.find(p => p.id === s.currentPortId)?.name ?? s.currentPortId]))).map(([id, name]) => ({ id, name })),
    [fleet, ports]);

    const filtered = useMemo(() => {
        const sf = STATUS_FILTERS.find(f => f.id === statusFilter) || STATUS_FILTERS[0];
        return fleet.filter(s => {
            if (!sf.match(s)) return false;
            if (classFilter !== 'all' && s.shipClass !== classFilter) return false;
            if (locationFilter !== 'all' && s.currentPortId !== locationFilter) return false;
            return true;
        });
    }, [fleet, statusFilter, classFilter, locationFilter]);

    const sorted = useMemo(() => [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'name':     return (a.name || '').localeCompare(b.name || '');
            case 'class':    return CLASS_ORDER.indexOf(a.shipClass) - CLASS_ORDER.indexOf(b.shipClass);
            case 'location': return (ports.find(p => p.id === a.currentPortId)?.name ?? '').localeCompare(ports.find(p => p.id === b.currentPortId)?.name ?? '');
            case 'fuel':     return (a.fuelLevel ?? 0) - (b.fuelLevel ?? 0);
            case 'hull':     return (a.healthPercentage ?? 0) - (b.healthPercentage ?? 0);
            default:         return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        }
    }), [filtered, sortBy, ports]);

    const counts = useMemo(() => {
        const c = { all: fleet.length };
        for (const f of STATUS_FILTERS) c[f.id] = fleet.filter(f.match).length;
        return c;
    }, [fleet]);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f6f9', position: 'relative', zIndex: 3, minHeight: 0, animation: 'appIn 0.22s ease-out' }}>
            <AppTitleBar icon="" title="My Fleet" color="#c89a20" onClose={onClose} />

            <div style={{ padding: '10px 12px', background: '#eef2f7', borderBottom: '1px solid #c4d0de', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <LightFilterRow label="Status">
                    {STATUS_FILTERS.map(f => (
                        <LightChip key={f.id} active={statusFilter === f.id} onClick={() => setStatusFilter(f.id)}>
                            {f.label}<span style={{ opacity: 0.55, marginLeft: 2 }}>·{counts[f.id] ?? 0}</span>
                        </LightChip>
                    ))}
                </LightFilterRow>
                <LightFilterRow label="Class">
                    {CLASS_FILTERS.map(f => <LightChip key={f.id} active={classFilter === f.id} onClick={() => setClassFilter(f.id)}>{f.label}</LightChip>)}
                </LightFilterRow>
                <LightFilterRow label="Port">
                    <LightSelect value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                        <option value="all">All ports</option>
                        {portList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </LightSelect>
                </LightFilterRow>
                <LightFilterRow label="Sort">
                    <LightSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </LightSelect>
                </LightFilterRow>
                <div style={{ flex: 1, minWidth: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', padding: '4px 9px', background: '#fff', border: '1px solid #c4d0de', borderRadius: 4 }}>
                    <span style={{ color: '#c89a20' }}>{sorted.length}</span>/{fleet.length}
                </span>
                <button onClick={loadFleet} disabled={loading} style={{ height: 30, padding: '0 10px', background: '#fff', border: '1px solid #c4d0de', borderRadius: 4, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', color: '#3d5a7a' }}>⟳</button>
            </div>

            {error && <div style={{ background: '#fde2e2', color: '#a11b1b', padding: '6px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>! {error}</div>}

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gridAutoRows: 'minmax(170px,auto)', gap: 10, alignContent: 'start', scrollbarWidth: 'thin', scrollbarColor: '#c4d0de transparent' }}>
                {loading && fleet.length === 0
                    ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14, fontWeight: 600 }}>Loading fleet…</div>
                    : sorted.length === 0
                    ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#64748b', background: '#fff', border: '1px dashed #c4d0de', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>— No ships match these filters —</div>
                    : sorted.map(ship => <LightShipCard key={ship.id} ship={ship} ports={ports} activeShips={activeShips} onAction={handleAction} onClick={() => setDetailShip(ship)} />)
                }
            </div>

            {detailShip && (
                <ShipDetailPanel
                    ship={detailShip}
                    ports={ports}
                    activeShips={activeShips}
                    myPlayerId={myPlayerId}
                    loading={loading}
                    onAction={handleAction}
                    onClose={() => setDetailShip(null)}
                />
            )}

            {sellTarget && (
                <SellConfirmModal
                    ship={sellTarget}
                    busy={selling}
                    onConfirm={confirmSell}
                    onCancel={() => { if (!selling) setSellTarget(null); }}
                />
            )}
        </div>
    );
}

function SellConfirmModal({ ship, busy, onConfirm, onCancel }) {
    const original = ship.price ?? 0;
    const resale = ship.sellPrice ?? 0;
    const hull = Math.round(ship.healthPercentage ?? 0);
    const lossPct = original > 0 ? Math.round((1 - resale / original) * 100) : 0;

    // Enter confirms; Esc intentionally does NOT close the dialog.
    useEffect(() => {
        function onKey(e) {
            if (e.key !== 'Enter') return;
            if (busy) return;
            e.stopImmediatePropagation();
            e.preventDefault();
            onConfirm();
        }
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [busy, onConfirm]);

    return createPortal(
        <div
            onClick={() => { if (!busy) onCancel(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 4000,
                background: 'rgba(15, 23, 42, 0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
            <FocusTrap
                onClick={e => e.stopPropagation()}
                aria-label="Confirm ship sale"
                style={{
                    width: 'min(400px, 94vw)', background: '#fff',
                    border: '1px solid #d8e0ea', borderRadius: 8,
                    boxShadow: '0 12px 40px rgba(15,23,42,0.3)', padding: '20px 22px 18px',
                }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                    Sell Ship
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    Sell <strong style={{ color: '#0f172a' }}>{ship.name || 'this vessel'}</strong> back to the
                    broker? It will be relisted as a USED ship on the global market.
                </p>

                <div style={{
                    border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 6,
                    padding: '12px 14px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <SellRow label="Original value" value={`${original.toLocaleString()}🪙`} />
                    <SellRow label="Hull condition" value={`${hull}%`} valueColor={hullColor(hull)} />
                    <SellRow label="Depreciation" value={`− ${lossPct}%`} valueColor="#b91c1c" />
                    <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Resale value
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
                            {resale.toLocaleString()}🪙
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} disabled={busy} style={{
                        padding: '9px 18px', borderRadius: 4, background: '#fff',
                        border: '1px solid #cbd5e1', color: '#475569',
                        fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                    }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={busy} style={{
                        padding: '9px 18px', borderRadius: 4, background: busy ? '#86efac' : '#16a34a',
                        border: '1px solid #15803d', color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                    }}>
                        {busy ? 'Selling…' : 'Confirm Sale'}
                    </button>
                </div>
            </FocusTrap>
        </div>,
        document.body,
    );
}

function SellRow({ label, value, valueColor }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ color: valueColor || '#1e293b', fontWeight: 700 }}>{value}</span>
        </div>
    );
}

function LightFilterRow({ label, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{children}</div>
        </div>
    );
}

function LightChip({ active, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            padding: '5px 10px',
            background: active ? '#2878d0' : '#fff',
            border: '1px solid ' + (active ? '#1d5fa8' : '#c4d0de'),
            color: active ? '#fff' : '#475569',
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
            transition: 'background 0.12s ease',
        }}>{children}</button>
    );
}

function LightSelect({ value, onChange, children }) {
    return (
        <select value={value} onChange={onChange} style={{
            background: '#fff', border: '1px solid #c4d0de', color: '#1e293b',
            fontSize: 12, padding: '5px 9px', borderRadius: 3, cursor: 'pointer', outline: 'none',
        }}>{children}</select>
    );
}

function LightShipCard({ ship, ports, activeShips, onAction, onClick }) {
    const status = statusInfo(ship);
    const portName = ports.find(p => p.id === ship.currentPortId)?.name ?? '—';
    const destName = ports.find(p => p.id === ship.destinationPortId)?.name ?? '—';
    const fuel = Math.round(ship.fuelLevel ?? 0);
    const hull = Math.round(ship.healthPercentage ?? 0);
    const docked = isDocked(ship.status);
    const atSea  = isAtSea(ship.status);
    const onHold = isCustomsHold(ship.status);
    const contraband = ship.loadedCargos?.some(c => c.illegal);
    const voyagePct = atSea ? voyageProgressFor(ship.id, activeShips) : 0;

    return (
        <article tabIndex={0} className="office-ship-card" onClick={onClick} style={{
            position: 'relative', minHeight: 170, background: '#fff',
            border: '1px solid #d8e0ea', borderRadius: 6,
            boxShadow: '0 1px 3px rgba(20,40,80,0.06)',
            overflow: 'hidden', display: 'flex', cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
        }}>
            <div style={{ position: 'relative', width: 116, flexShrink: 0, background: 'radial-gradient(ellipse at center,#e0eef9 0%,#f4f7fb 80%)', borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {contraband && <span title="Contraband" style={{ position: 'absolute', top: 4, right: 4, zIndex: 3, fontSize: 12 }}></span>}
                <img src={spriteFor(ship)} alt={ship.name} draggable={false} style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: '92%', maxHeight: '88%', objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 3px 5px rgba(20,40,80,0.18))',
                    animation: 'shipBob 3.2s ease-in-out infinite',
                }} />
            </div>

            <div style={{ flex: 1, minWidth: 0, padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ background: status.bg, color: status.fg, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {status.icon} {status.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ship.name}</span>
                    {(ship.mortgaged || ship.status === 'SEIZED') && (
                        <span title={ship.status === 'SEIZED' ? 'Repossessed by the bank' : 'Mortgaged — cannot be sold until paid off'}
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {ship.status === 'SEIZED' ? 'SEIZED' : 'MORTGAGED'}
                        </span>
                    )}
                </div>

                <div style={{ fontSize: 11.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {classLabel(ship.shipClass)}{ship.capacity ? ` · ${ship.capacity}t` : ''} ·{' '}
                    {atSea ? <>→ <strong style={{ color: '#1e293b' }}>{destName}</strong></> : <strong style={{ color: '#1e293b' }}>{portName}</strong>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ship.usingAlternativeRoute && (ship.reserveFuelCapacity ?? 0) > 0 && (
                        <CompactBar icon="" label="Reserve" value={reserveTankPercent(ship)} color="#38bdf8" />
                    )}
                    <CompactBar icon="" label="Fuel" value={fuel} color={fuelColor(fuel)} />
                    <CompactBar icon="" label="Hull" value={hull} color={hullColor(hull)} />
                </div>

                {atSea && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>
                        <span style={{ flexShrink: 0 }}>Voyage</span>
                        <div style={{ flex: 1, background: '#dbe5f1', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${voyagePct}%`, height: '100%', background: '#2878d0', transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ flexShrink: 0, fontWeight: 700 }}>{voyagePct}%</span>
                    </div>
                )}

                {onHold && (
                    <div style={{ fontSize: 11, color: '#7f1d1d', fontWeight: 700, display: 'flex', justifyContent: 'space-between', background: '#fee2e2', padding: '3px 7px', borderRadius: 3 }}>
                        <span>{status.icon} {status.label}</span>
                        {ship.customsHoldRemainingTicks != null && <span>{ship.customsHoldRemainingTicks}d left</span>}
                    </div>
                )}

                {!atSea && !onHold && ship.loadedCargos?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', gap: 4, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: contraband ? '#b91c1c' : '#92400e', padding: '1px 4px', background: contraband ? '#fee2e2' : '#fef3c7', borderRadius: 2, flexShrink: 0 }}>
                            {contraband ? 'CONTRA' : 'CARGO'}
                        </span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{ship.loadedCargos[0].description}</span>
                        <span>→ {ship.loadedCargos[0].destinationPortName}</span>
                    </div>
                )}
            </div>

            <div className="office-quick-actions" onClick={e => e.stopPropagation()}>
                <QA icon="" label="Refuel" disabled={fuel >= 100 || !docked} onClick={() => onAction('refuel', ship)} title={fuel >= 100 ? 'Tank full' : docked ? 'Refuel' : 'Must be docked'} />
                <QA icon="" label="Repair" disabled={hull >= 100 || !docked} onClick={() => onAction('repair', ship)} title={hull >= 100 ? 'Hull OK' : docked ? 'Repair' : 'Must be docked'} />
                <QA icon="" label="Sell" danger disabled={atSea || onHold || ship.mortgaged || ship.status === 'SEIZED'} onClick={() => onAction('sell', ship)} title={atSea ? 'At sea' : onHold ? 'Customs hold' : ship.status === 'SEIZED' ? 'Repossessed by the bank' : ship.mortgaged ? 'Mortgaged — pay off first' : 'Sell ship'} />
            </div>
        </article>
    );
}

function ShipDetailPanel({ ship, ports, activeShips, myPlayerId, loading, onAction, onClose }) {
    const status = statusInfo(ship);
    const portName = ports.find(p => p.id === ship.currentPortId)?.name ?? '—';
    const fuel = Math.round(ship.fuelLevel ?? 0);
    const hull = Math.round(ship.healthPercentage ?? 0);
    const docked = isDocked(ship.status);
    const atSea  = isAtSea(ship.status);
    const onHold = isCustomsHold(ship.status);
    const contraband = ship.loadedCargos?.some(c => c.illegal);
    const isCritical = hull < 20;
    const voyagePct = atSea ? voyageProgressFor(ship.id, activeShips) : 0;

    const [destPortId, setDestPortId] = useState('');
    const otherPorts = ports.filter(p => p.id !== ship.currentPortId);

    const canRefuel = fuel < 100 && docked;
    const canRepair = hull < 100 && docked;
    const tankFull  = fuel >= 100;
    const hullFull  = hull >= 100;
    const canSail   = docked && !onHold && destPortId && hull >= 20;
    const refuelCost = Math.round((100 - fuel) * FUEL_PRICE_PER_UNIT);
    const repairCost = Math.round((100 - hull) * REPAIR_COST_PER_HP);

    function handleSail() {
        onAction('sail', { ...ship, destinationPortId: destPortId });
    }

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 8,
            background: '#f4f6f9',
            display: 'flex', flexDirection: 'column',
            animation: 'appIn 0.18s ease-out',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: '#eef2f7', borderBottom: '1px solid #c4d0de',
                flexShrink: 0,
            }}>
                <button onClick={onClose} style={{
                    height: 30, padding: '0 10px',
                    background: '#fff', border: '1px solid #c4d0de', borderRadius: 4,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#3d5a7a',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>← Back</button>
                <span style={{
                    background: status.bg, color: status.fg,
                    padding: '3px 8px', borderRadius: 3,
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                }}>{status.icon} {status.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ship.name}</span>
                {contraband && <span title="Contraband on board" style={{ fontSize: 16 }}></span>}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                        width: 180, height: 150, flexShrink: 0,
                        background: 'radial-gradient(ellipse at center,#e0eef9 0%,#f4f7fb 80%)',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', position: 'relative',
                    }}>
                        <img src={spriteFor(ship)} alt={ship.name} draggable={false} style={{
                            width: '95%', maxHeight: '92%', objectFit: 'contain',
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(0 4px 8px rgba(20,40,80,0.25))',
                            animation: 'shipBobCenter 3.2s ease-in-out infinite',
                        }} />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{classLabel(ship.shipClass)}</span>
                            {ship.capacity ? <span> · {ship.capacity}t capacity</span> : null}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            {atSea ? <>En route → <strong style={{ color: '#0f172a' }}>{ports.find(p => p.id === ship.destinationPortId)?.name ?? '—'}</strong></> : <><strong style={{ color: '#0f172a' }}>{portName}</strong></>}
                        </div>

                        <DetailBar icon="" label="Fuel" value={fuel} color={fuelColor(fuel)} />
                        <DetailBar icon="" label="Hull" value={hull} color={hullColor(hull)} />

                        {isCritical && !atSea && (
                            <div style={{ fontSize: 12, color: '#c62828', fontWeight: 700 }}>Hull critical — repair before sailing!</div>
                        )}
                    </div>
                </div>

                {atSea && (
                    <div style={{ background: '#fff', border: '1px solid #d8e0ea', borderRadius: 6, padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 7 }}>Voyage in Progress</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, background: '#dbe5f1', height: 9, borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${voyagePct}%`, height: '100%', background: '#2878d0', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#2878d0', flexShrink: 0 }}>{voyagePct}%</span>
                        </div>
                    </div>
                )}

                {onHold && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#7f1d1d', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{status.icon} Customs Hold</span>
                            {ship.customsHoldRemainingTicks != null && <span>{ship.customsHoldRemainingTicks} days remaining</span>}
                        </div>
                    </div>
                )}

                {ship.loadedCargos?.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #d8e0ea', borderRadius: 6, padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>Loaded Cargo</div>
                        {ship.loadedCargos.map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                                <div>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 5px', borderRadius: 2, background: c.illegal ? '#fee2e2' : '#fef3c7', color: c.illegal ? '#b91c1c' : '#92400e', marginRight: 6 }}>
                                        {c.illegal ? 'CONTRA' : 'CARGO'}
                                    </span>
                                    <strong>{c.description}</strong>
                                </div>
                                <span style={{ color: '#64748b' }}>→ {c.destinationPortName}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ background: '#fff', border: '1px solid #d8e0ea', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 1, textTransform: 'uppercase' }}>Actions</div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onAction('refuel', ship)} disabled={!canRefuel || loading} style={{
                            flex: 1, padding: '10px 8px', borderRadius: 4,
                            background: canRefuel ? '#dbeafe' : '#f1f5f9',
                            border: '1px solid ' + (canRefuel ? '#93c5fd' : '#e2e8f0'),
                            color: canRefuel ? '#1d4ed8' : '#94a3b8',
                            fontSize: 13, fontWeight: 700, cursor: canRefuel ? 'pointer' : 'not-allowed',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                            <span>{tankFull ? 'Tank full' : 'Refuel'}</span>
                            {!tankFull && <span style={{ fontSize: 11, opacity: 0.8 }}>{refuelCost.toLocaleString()}🪙</span>}
                        </button>
                        <button onClick={() => onAction('repair', ship)} disabled={!canRepair || loading} style={{
                            flex: 1, padding: '10px 8px', borderRadius: 4,
                            background: canRepair ? (isCritical ? '#fee2e2' : '#dcfce7') : '#f1f5f9',
                            border: '1px solid ' + (canRepair ? (isCritical ? '#fca5a5' : '#86efac') : '#e2e8f0'),
                            color: canRepair ? (isCritical ? '#b91c1c' : '#15803d') : '#94a3b8',
                            fontSize: 13, fontWeight: 700, cursor: canRepair ? 'pointer' : 'not-allowed',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        }}>
                            <span>{hullFull ? 'Hull OK' : 'Repair'}</span>
                            {!hullFull && <span style={{ fontSize: 11, opacity: 0.8 }}>{repairCost.toLocaleString()}🪙</span>}
                        </button>
                    </div>

                    {docked && !onHold && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>Set Sail</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                    value={destPortId}
                                    onChange={e => setDestPortId(e.target.value)}
                                    disabled={loading}
                                    style={{ flex: 1, background: '#fff', border: '1px solid #c4d0de', color: '#1a2638', padding: '9px 10px', borderRadius: 4, fontSize: 13, outline: 'none' }}
                                >
                                    <option value="">— Choose destination —</option>
                                    {otherPorts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button
                                    onClick={handleSail}
                                    disabled={!canSail || loading}
                                    style={{
                                        padding: '9px 18px', borderRadius: 4,
                                        background: canSail ? '#2878d0' : '#e2e8f0',
                                        border: '1px solid ' + (canSail ? '#1d5fa8' : '#cbd5e1'),
                                        color: canSail ? '#fff' : '#94a3b8',
                                        fontSize: 13, fontWeight: 700, cursor: canSail ? 'pointer' : 'not-allowed',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {loading ? '…' : 'Set Sail'}
                                </button>
                            </div>
                            {isCritical && (
                                <div style={{ fontSize: 12, color: '#c62828', marginTop: 5 }}>Cannot sail below 20% hull — repair first.</div>
                            )}
                            {ship.status === ShipStatus.LOADED && ship.loadedCargos?.length > 0 && (
                                <div style={{ fontSize: 12, color: '#92400e', marginTop: 5 }}>Ship has cargo loaded — sail to its destination for full reward.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailBar({ icon, label, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 56, color: '#64748b', flexShrink: 0 }}>{icon} {label}</span>
            <div style={{ flex: 1, background: '#e2e8f0', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ width: 36, textAlign: 'right', color, fontWeight: 700, flexShrink: 0 }}>{value}%</span>
        </div>
    );
}

function CompactBar({ icon, label, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5 }}>
            <span style={{ width: 40, color: '#64748b', flexShrink: 0 }}>{icon} {label}</span>
            <div style={{ flex: 1, background: '#e2e8f0', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ width: 30, textAlign: 'right', color, fontWeight: 700, flexShrink: 0 }}>{value}%</span>
        </div>
    );
}

function QA({ icon, label, onClick, disabled, danger, title }) {
    const [hover, setHover] = useState(false);
    const baseColor = danger ? '#b91c1c' : '#3d5a7a';
    const hoverBg   = danger ? '#fee2e2' : '#dbeafe';
    return (
        <button onClick={onClick} disabled={disabled} title={title}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
                background: hover && !disabled ? hoverBg : '#fff',
                border: '1px solid ' + (hover && !disabled ? baseColor : '#cbd5e1'),
                color: baseColor, padding: '6px 3px', borderRadius: 3,
                fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'background 0.12s ease, border-color 0.12s ease',
            }}
        >
            <span style={{ fontSize: 13 }}>{icon}</span>
            {label}
        </button>
    );
}

function CargoInMonitor({ portId, sessionId, myPlayerId, currentPortName, ports, currentTick, updatePlayerState, pushToast, onClose, onAccepted, focusContractId, focusShipId }) {
    const [contracts, setContracts]         = useState([]);
    const [idleShips, setIdleShips]         = useState([]);
    const [selectedShipId, setSelectedShipId] = useState('');
    const [viewMode, setViewMode]           = useState(focusContractId ? 'GLOBAL' : 'LOCAL');
    const [filterPortId, setFilterPortId]   = useState('');
    const [loading, setLoading]             = useState(false);
    const [confirmCargo, setConfirmCargo]   = useState(null);
    const focusRowRef                       = useRef(null);

    const selectedShip = idleShips.find(s => s.id === selectedShipId);
    const activePortId   = selectedShip?.currentPortId ?? portId;
    const activePortName = ports.find(p => p.id === activePortId)?.name ?? currentPortName;

    useEffect(() => { refreshData(); }, [activePortId, sessionId, myPlayerId, viewMode, currentTick]);

    useEffect(() => {
        if (!focusContractId) return;
        if (!contracts.some(c => c.id === focusContractId)) return;
        const id = requestAnimationFrame(() => {
            focusRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return () => cancelAnimationFrame(id);
    }, [focusContractId, contracts]);

    async function refreshData() {
        try {
            const [cargoData, fleetData] = await Promise.all([
                viewMode === 'LOCAL'
                    ? gameService.getCargo(activePortId, sessionId, currentTick)
                    : gameService.getAllCargo(sessionId, currentTick),
                gameService.getFleet(myPlayerId),
            ]);
            setContracts(cargoData);
            const available = fleetData.filter(s =>
                s.status === ShipStatus.IDLE || s.status === ShipStatus.LOADED);
            setIdleShips(available);
            if (available.length > 0 && !available.find(s => s.id === selectedShipId)) {
                const preferred = available.find(s => s.id === focusShipId)
                    ?? available.find(s => s.currentPortId === portId)
                    ?? available[0];
                setSelectedShipId(preferred.id);
            }
        } catch (err) { pushToast('Error', err.message); }
    }

    async function loadData() {
        setLoading(true);
        try { await refreshData(); }
        finally { setLoading(false); }
    }

    async function confirmAccept() {
        if (!confirmCargo || !selectedShipId) return;
        setLoading(true);
        try {
            await gameService.acceptCargo(myPlayerId, confirmCargo.id, selectedShipId);
            updatePlayerState(myPlayerId, { shipStatus: ShipStatus.LOADING });
            pushToast('Cargo Accepted', `${confirmCargo.destinationPortName} run confirmed.`);
            setConfirmCargo(null);
            onAccepted();
        } catch (err) { pushToast('Error', err.message); setLoading(false); setConfirmCargo(null); }
    }

    const active  = contracts.filter(c => c.expiresAtTick > currentTick);
    const visible = active.filter(c => filterPortId === '' || c.originPortId === filterPortId);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f6f9', position: 'relative', zIndex: 3, minHeight: 0, animation: 'appIn 0.22s ease-out' }}>
            <AppTitleBar icon="" title={`Cargo Market — ${viewMode === 'LOCAL' ? activePortName : 'Global'}`} color="#2878d0" onClose={onClose} />

            <div style={{ padding: '10px 12px', background: '#eef2f7', borderBottom: '1px solid #c4d0de', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <select value={selectedShipId} onChange={e => setSelectedShipId(e.target.value)} disabled={idleShips.length === 0 || loading} style={{ width: '100%', background: '#fff', border: '1px solid #c4d0de', color: '#1a2638', padding: '7px 10px', borderRadius: 4, fontSize: 13, outline: 'none' }}>
                    {idleShips.length === 0
                        ? <option>— No idle ships available —</option>
                        : idleShips.map(s => {
                            const portName = ports.find(p => p.id === s.currentPortId)?.name ?? s.currentPortId;
                            return <option key={s.id} value={s.id}>{s.name} ({portName}) · {s.capacity}t</option>;
                        })}
                </select>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <LightChip active={viewMode === 'LOCAL'}  onClick={() => { setViewMode('LOCAL'); setFilterPortId(''); }}>LOCAL</LightChip>
                    <LightChip active={viewMode === 'GLOBAL'} onClick={() => setViewMode('GLOBAL')}>GLOBAL</LightChip>
                    {viewMode === 'GLOBAL' && (
                        <LightSelect value={filterPortId} onChange={e => setFilterPortId(e.target.value)}>
                            <option value="">All origins</option>
                            {Array.from(new Set(active.map(c => c.originPortId))).map(id => {
                                const c = active.find(x => x.originPortId === id);
                                return <option key={id} value={id}>{c?.originPortName || id}</option>;
                            })}
                        </LightSelect>
                    )}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', padding: '4px 9px', background: '#fff', border: '1px solid #c4d0de', borderRadius: 4 }}>
                        <span style={{ color: '#2878d0' }}>{visible.length}</span> contracts
                    </span>
                    <button onClick={loadData} disabled={loading} style={{ height: 30, padding: '0 10px', background: '#fff', border: '1px solid #c4d0de', borderRadius: 4, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', color: '#3d5a7a' }}>⟳</button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '9px 11px 12px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'thin', scrollbarColor: '#c4d0de transparent' }}>
                {visible.length === 0 && !loading
                    ? <p style={{ textAlign: 'center', padding: 35, color: '#64748b', fontWeight: 600, fontSize: 13 }}>— NO ACTIVE CONTRACTS —</p>
                    : visible.map(c => (
                        <InMonitorContractRow key={c.id} cargo={c} viewMode={viewMode} portId={activePortId} currentTick={currentTick}
                            selectedShip={selectedShip}
                            disabled={loading || idleShips.length === 0}
                            onAccept={() => setConfirmCargo(c)}
                            highlighted={focusContractId === c.id}
                            rowRef={focusContractId === c.id ? focusRowRef : null} />
                    ))}
            </div>

            {confirmCargo && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setConfirmCargo(null)}>
                    <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 380, boxShadow: '0 10px 30px rgba(20,40,80,0.35)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: '#2878d0', color: '#fff', padding: '11px 14px', fontWeight: 700, fontSize: 14 }}>Confirm Loading</div>
                        <div style={{ padding: '14px', fontSize: 13, color: '#1a2638', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div>Destination: <strong style={{ color: '#0f172a' }}>{confirmCargo.destinationPortName}</strong></div>
                            <div>Volume: <strong style={{ color: '#0f172a' }}>{confirmCargo.requiredCapacity}t</strong></div>
                            <div>Reward: <strong style={{ color: '#b8860b' }}>{confirmCargo.reward?.toLocaleString()}🪙</strong></div>
                            <div style={{ color: confirmCargo.riskLevel === 'HIGH' ? '#c62828' : '#2878d0', fontWeight: 700 }}>Risk: {confirmCargo.riskLevel}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, padding: '11px 14px', borderTop: '1px solid #e2e8f0' }}>
                            <button onClick={() => setConfirmCargo(null)} disabled={loading} style={{ flex: 1, padding: '9px', background: '#f1f5f9', border: '1px solid #c4d0de', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
                            <button onClick={confirmAccept} disabled={loading} style={{ flex: 1, padding: '9px', background: '#2878d0', border: 'none', color: '#fff', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                                {loading ? 'Loading…' : 'Approve & Load'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InMonitorContractRow({ cargo, viewMode, portId, currentTick, selectedShip, disabled, onAccept, highlighted, rowRef }) {
    const isTooHeavy  = selectedShip && cargo.requiredCapacity > selectedShip.capacity;
    const isWrongPort = viewMode === 'GLOBAL' && cargo.originPortId !== portId;
    const remaining   = cargo.expiresAtTick - currentTick;
    const expiringSoon = remaining <= 3;

    return (
        <div ref={rowRef} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '11px 13px',
            background: highlighted ? '#fff8dc' : '#fff',
            border: '1px solid ' + (highlighted ? '#c89a20' : '#d8e0ea'),
            boxShadow: highlighted ? '0 0 0 2px rgba(200,154,32,0.35)' : 'none',
            borderRadius: 5, gap: 10, fontSize: 13,
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>
                    {viewMode === 'GLOBAL' && <span style={{ color: '#64748b', fontWeight: 400 }}>{cargo.originPortName} </span>}
                    → {cargo.destinationPortName || '???'}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, color: '#64748b', fontSize: 11.5, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{cargo.requiredCapacity}t</span>
                    <span style={{ padding: '2px 5px', borderRadius: 3, background: cargo.riskLevel === 'HIGH' ? '#c62828' : '#2878d0', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{cargo.riskLevel}</span>
                    <span style={{ color: expiringSoon ? '#c62828' : '#64748b', fontWeight: expiringSoon ? 700 : 400 }}>Expires in {remaining}d</span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ color: '#b8860b', fontWeight: 700, fontSize: 14 }}>{cargo.reward ? cargo.reward.toLocaleString() : 0}🪙</div>
                {!isWrongPort && (
                    <button onClick={onAccept} disabled={disabled || isTooHeavy} style={{
                        background: isTooHeavy ? '#e2e8f0' : '#2878d0',
                        border: '1px solid ' + (isTooHeavy ? '#cbd5e1' : '#1d5fa8'),
                        color: isTooHeavy ? '#94a3b8' : '#fff',
                        padding: '6px 11px', borderRadius: 4,
                        fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                        cursor: (disabled || isTooHeavy) ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
                    }}>
                        {isTooHeavy ? 'Too Heavy' : 'Accept'}
                    </button>
                )}
            </div>
        </div>
    );
}
