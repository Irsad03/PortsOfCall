import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';
import { FocusTrap } from './FocusTrap';

import bankExterior from '../assets/bank/atlantic_best.png';
import taxiCutout   from '../assets/bank/taxi.png';
import doorCutout   from '../assets/bank/door.png';
import advisorImg   from '../assets/bank/berater_best.png';

const TERMS = [
    { ticks: 30,  label: 'Short term'    },
    { ticks: 60,  label: 'Standard term' },
    { ticks: 120, label: 'Long term'     },
];
const DEFAULT_TERM = 60;

const euro = (n) => `${Math.round(n ?? 0).toLocaleString()}🪙`;

export default function BankView({ myPlayerId, onBack, onTaxi }) {
    const [scene, setScene] = useState('exterior');

    const back = useCallback(() => {
        setScene(s => {
            if (s === 'advisor') return 'exterior';
            onBack?.();
            return s;
        });
    }, [onBack]);

    return createPortal(
        <FocusTrap style={{ position: 'fixed', inset: 0, zIndex: 900, overflow: 'hidden', background: '#000' }}>
            <div style={stageWrapStyle}>
                <div style={stageStyle}>
                    {scene === 'exterior'
                        ? <ExteriorScene onLeave={onTaxi} onEnter={() => setScene('advisor')} />
                        : <AdvisorScene myPlayerId={myPlayerId} onLeave={() => setScene('exterior')} />}
                </div>
            </div>

            <button
                onClick={back}
                aria-label="Back"
                title="Back"
                style={closeBtnStyle}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(4,9,15,0.72)'; }}
            >✕</button>

            <style>{`
                @keyframes bankFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes bubblePop  { from { opacity: 0; transform: translateY(8px) scale(0.96); }
                                        to   { opacity: 1; transform: translateY(0)   scale(1); } }
            `}</style>
        </FocusTrap>,
        document.body,
    );
}

const OBJECTS = [
    { key: 'door', src: doorCutout, action: 'enter', label: 'Enter' },
    { key: 'taxi', src: taxiCutout, action: 'leave', label: 'Return to Office' },
];

const SILHOUETTE_GLOW =
    'brightness(1.18)'
    + ' drop-shadow(2px 0 0 #ffd27a) drop-shadow(-2px 0 0 #ffd27a)'
    + ' drop-shadow(0 2px 0 #ffd27a) drop-shadow(0 -2px 0 #ffd27a)'
    + ' drop-shadow(0 0 16px rgba(255,210,120,0.95))';

function ExteriorScene({ onLeave, onEnter }) {
    const wrapRef  = useRef(null);
    const masksRef = useRef({});
    const [hovered, setHovered] = useState(null);
    const [bboxes,  setBboxes]  = useState({});

    useEffect(() => {
        let alive = true;
        OBJECTS.forEach(({ key, src }) => {
            const img = new Image();
            img.onload = () => {
                if (!alive) return;
                const w = 480, h = Math.max(1, Math.round(480 * img.height / img.width));
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, w, h);
                const data = ctx.getImageData(0, 0, w, h).data;
                let minX = w, maxX = -1, minY = h, maxY = -1;
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        if (data[(y * w + x) * 4 + 3] > 40) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
                const bbox = maxX >= minX
                    ? { cx: (minX + maxX) / 2 / w, top: minY / h,
                        x: minX / w, y: minY / h,
                        w: (maxX - minX + 1) / w, h: (maxY - minY + 1) / h }
                    : { cx: 0.5, top: 0.5, x: 0.4, y: 0.4, w: 0.2, h: 0.2 };
                masksRef.current[key] = { ctx, w, h };
                setBboxes(prev => ({ ...prev, [key]: bbox }));
            };
            img.src = src;
        });
        return () => { alive = false; };
    }, []);

    function objectAt(e) {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top)  / rect.height;
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
        for (const obj of OBJECTS) {
            const m = masksRef.current[obj.key];
            if (!m) continue;
            const x = Math.min(m.w - 1, Math.max(0, Math.round(fx * m.w)));
            const y = Math.min(m.h - 1, Math.max(0, Math.round(fy * m.h)));
            if (m.ctx.getImageData(x, y, 1, 1).data[3] > 40) return obj;
        }
        return null;
    }

    return (
        <div
            ref={wrapRef}
            onMouseMove={e => { const o = objectAt(e); setHovered(o ? o.key : null); }}
            onMouseLeave={() => setHovered(null)}
            onClick={e => {
                const o = objectAt(e);
                if (o?.action === 'enter') onEnter();
                else if (o?.action === 'leave') onLeave();
            }}
            style={{ position: 'absolute', inset: 0, animation: 'bankFadeIn 0.4s ease',
                     cursor: hovered ? 'pointer' : 'default' }}
        >
            <img src={bankExterior} alt="Atlantic Bank" draggable={false}
                 style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'center',
                          userSelect: 'none', pointerEvents: 'none' }} />

            {OBJECTS.map(({ key, src }) => (
                <img key={key} src={src} alt="" draggable={false}
                     style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                              objectFit: 'cover', objectPosition: 'center',
                              pointerEvents: 'none', userSelect: 'none',
                              filter: hovered === key ? SILHOUETTE_GLOW : 'brightness(1)',
                              transition: 'filter 0.18s ease' }} />
            ))}

            {OBJECTS.map(({ key, action, label }) => {
                const b = bboxes[key];
                if (!b) return null;
                return (
                    <button
                        key={`hotspot-${key}`}
                        type="button"
                        className="bank-hotspot"
                        aria-label={label}
                        autoFocus={action === 'enter'}
                        onFocus={() => setHovered(key)}
                        onBlur={() => setHovered(h => (h === key ? null : h))}
                        onClick={() => { if (action === 'enter') onEnter(); else if (action === 'leave') onLeave(); }}
                        style={{
                            position: 'absolute',
                            left:   `${b.x * 100}%`, top:    `${b.y * 100}%`,
                            width:  `${b.w * 100}%`, height: `${b.h * 100}%`,
                            background: 'transparent', border: 'none', padding: 0, margin: 0,
                            cursor: 'pointer',
                            pointerEvents: 'none',
                        }}
                    />
                );
            })}

            {hovered && bboxes[hovered] && (
                <div style={{
                    position: 'absolute',
                    left: `${bboxes[hovered].cx * 100}%`,
                    top:  `${bboxes[hovered].top * 100}%`,
                    transform: 'translate(-50%, calc(-100% - 10px))',
                    background: 'rgba(4,9,15,0.82)', color: '#fff', padding: '6px 14px', borderRadius: 8,
                    fontFamily: "'Press Start 2P', monospace", fontSize: 11, letterSpacing: 1,
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,210,120,0.7)', pointerEvents: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                }}>
                    {OBJECTS.find(o => o.key === hovered)?.label}
                </div>
            )}

            <div style={captionStyle}>
                Welcome to the <strong style={{ color: 'var(--color-gold, #ffc857)' }}>Atlantic Bank</strong> — step
                through the doors, or hail the taxi to head back to the office.
            </div>
        </div>
    );
}

function AdvisorScene({ myPlayerId, onLeave }) {
    const { refreshMyBalance, players, currentTick } = useGame();
    const myMoney = players.find(p => p.playerId === myPlayerId)?.money ?? 0;

    const [step,    setStep]    = useState('welcome');
    const [line,    setLine]    = useState('');
    const [loading, setLoading] = useState(false);

    const [creditInfo, setCreditInfo] = useState(null);
    const [amount, setAmount]   = useState(0);
    const [term,   setTerm]     = useState(DEFAULT_TERM);
    const [quote,  setQuote]    = useState(null);
    const [granted, setGranted] = useState(null);

    const [mortgageOptions, setMortgageOptions] = useState([]);
    const [selectedShip, setSelectedShip] = useState(null);
    const [mAmount, setMAmount] = useState(0);
    const [mTerm,   setMTerm]   = useState(DEFAULT_TERM);
    const [mQuote,  setMQuote]  = useState(null);
    const [mGranted, setMGranted] = useState(null);

    const say = useCallback((text) => setLine(text), []);

    useEffect(() => {
        say(`Aha, a new captain! Welcome to the Atlantic Bank. Your balance stands at ${euro(myMoney)}. How may I be of service today?`);
    }, []);

    useEffect(() => {
        if (step !== 'choose') return undefined;
        if (amount <= 0) { setQuote(null); return undefined; }
        const id = setTimeout(async () => {
            try {
                setQuote(await gameService.getLoanQuote(myPlayerId, amount, term));
            } catch { }
        }, 250);
        return () => clearTimeout(id);
    }, [step, amount, term, myPlayerId]);

    async function startLoan() {
        setLoading(true);
        try {
            const info = await gameService.getLoanQuote(myPlayerId, 0, term);
            setCreditInfo(info);
            if (info.maxLoan < 1000) {
                setStep('denied');
                say("I've reviewed your standing, and I'm sorry to say we can't extend you a loan at this time. Build up your capital and come see me again.");
            } else {
                const start = Math.min(10_000, info.maxLoan);
                setAmount(start);
                setStep('choose');
                say(`Splendid! Based on your ${info.creditRating} credit rating, I can offer you up to ${euro(info.maxLoan)}. How much would you like to borrow?`);
            }
        } catch {
        } finally { setLoading(false); }
    }

    function goReview() {
        if (!quote?.approved) return;
        setStep('review');
        say(`Very well. A loan of ${euro(quote.amount)} over ${quote.termTicks} days at ${(quote.interestRate * 100).toFixed(1)}% interest. You'll repay ${euro(quote.totalRepayable)} in total — roughly ${euro(quote.tickPayment)} per day. Shall I draw up the papers?`);
    }

    async function confirmLoan() {
        setLoading(true);
        try {
            const loan = await gameService.takeLoan(myPlayerId, amount, term, currentTick);
            setGranted(loan);
            setStep('done');
            say(`Excellent! ${euro(loan.principal)} has been deposited into your account. A pleasure doing business, captain — sail safely!`);
            if (refreshMyBalance) await refreshMyBalance(myPlayerId);
        } catch {
        } finally { setLoading(false); }
    }

    useEffect(() => {
        if (step !== 'chooseM' || !selectedShip) return undefined;
        if (mAmount <= 0) { setMQuote(null); return undefined; }
        const id = setTimeout(async () => {
            try {
                setMQuote(await gameService.getMortgageQuote(myPlayerId, selectedShip.shipId, mAmount, mTerm));
            } catch { }
        }, 250);
        return () => clearTimeout(id);
    }, [step, mAmount, mTerm, selectedShip, myPlayerId]);

    async function startMortgage() {
        setLoading(true);
        try {
            const opts = await gameService.getMortgageOptions(myPlayerId);
            setMortgageOptions(opts);
            const eligible = opts.filter(o => o.eligible);
            if (eligible.length === 0) {
                setStep('mDenied');
                say(opts.length === 0
                    ? "You don't own any ships yet, captain. Acquire a vessel first and I'll gladly mortgage it for you."
                    : "I'm afraid none of your ships qualify right now — they're either already pledged or too modest in value.");
            } else {
                setStep('pickShip');
                say('Certainly. Which of your fine vessels shall we put up as collateral?');
            }
        } catch {
        } finally { setLoading(false); }
    }

    function pickShip(opt) {
        setSelectedShip(opt);
        const start = Math.min(10_000, opt.maxMortgage);
        setMAmount(start >= 1000 ? start : opt.maxMortgage);
        setMQuote(null);
        setStep('chooseM');
        say(`The ${opt.shipName}, valued at ${euro(opt.shipValue)}. I can advance up to ${euro(opt.maxMortgage)} against her. How much would you like?`);
    }

    function goReviewMortgage() {
        if (!mQuote?.approved) return;
        setStep('reviewM');
        say(`A mortgage of ${euro(mQuote.amount)} on the ${mQuote.shipName}, over ${mQuote.termTicks} days at ${(mQuote.interestRate * 100).toFixed(1)}% interest — ${euro(mQuote.totalRepayable)} to repay, about ${euro(mQuote.tickPayment)} per day. Be warned: miss too many payments and the bank repossesses the ship. Shall I draw up the deed?`);
    }

    async function confirmMortgage() {
        setLoading(true);
        try {
            const m = await gameService.takeMortgage(myPlayerId, selectedShip.shipId, mAmount, mTerm, currentTick);
            setMGranted(m);
            setStep('doneM');
            say(`Done! ${euro(m.principal)} has been deposited, secured against the ${m.shipName}. Keep up with the payments and she stays firmly yours.`);
            if (refreshMyBalance) await refreshMyBalance(myPlayerId);
        } catch {
        } finally { setLoading(false); }
    }

    function backToWelcome() {
        setStep('welcome');
        setQuote(null); setMQuote(null); setSelectedShip(null);
        say('Is there anything else I can help you with, captain?');
    }

    return (
        <div style={{ position: 'absolute', inset: 0, animation: 'bankFadeIn 0.4s ease', background: '#05080f' }}>
            <img
                src={advisorImg}
                alt="Bank advisor"
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                         objectFit: 'cover', objectPosition: 'center',
                         userSelect: 'none', pointerEvents: 'none' }}
            />

            <div style={scrimStyle} />

            <div style={panelStyle}>
                <SpeechBubble key={line} text={line} />

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {step === 'welcome' && (
                        <>
                            <DialogButton primary disabled={loading} onClick={startLoan}>
                                I'd like to take out a loan
                            </DialogButton>
                            <DialogButton disabled={loading} onClick={startMortgage}>
                                I'd like to mortgage a ship
                            </DialogButton>
                            <DialogButton onClick={onLeave}>Maybe later</DialogButton>
                        </>
                    )}

                    {step === 'denied' && (
                        <DialogButton onClick={backToWelcome}>I understand</DialogButton>
                    )}

                    {step === 'mDenied' && (
                        <DialogButton onClick={backToWelcome}>I understand</DialogButton>
                    )}

                    {step === 'pickShip' && (
                        <ShipPicker
                            options={mortgageOptions}
                            onPick={pickShip}
                            onCancel={backToWelcome}
                        />
                    )}

                    {step === 'chooseM' && selectedShip && (
                        <MortgageChooser
                            ship={selectedShip}
                            amount={mAmount} setAmount={setMAmount}
                            term={mTerm} setTerm={setMTerm}
                            quote={mQuote}
                            loading={loading}
                            onRequest={goReviewMortgage}
                            onCancel={backToWelcome}
                        />
                    )}

                    {step === 'reviewM' && mQuote && (
                        <>
                            <MortgageSummary quote={mQuote} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <DialogButton onClick={() => { setStep('chooseM'); say('Of course — adjust the amount however you like.'); }}
                                              style={{ flex: 1 }}>
                                    ← Change
                                </DialogButton>
                                <DialogButton primary disabled={loading} onClick={confirmMortgage} style={{ flex: 2 }}>
                                    {loading ? 'Processing…' : 'Confirm mortgage'}
                                </DialogButton>
                            </div>
                        </>
                    )}

                    {step === 'doneM' && mGranted && (
                        <>
                            <div style={grantBoxStyle}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted, #8a96a3)' }}>Deposited</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-gold, #ffc857)' }}>
                                    + {euro(mGranted.principal)}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)', marginTop: 4 }}>
                                    Secured against the {mGranted.shipName} · repay {euro(mGranted.totalRepayable)} over {mGranted.termTicks} days
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <DialogButton onClick={backToWelcome} style={{ flex: 1 }}>Something else</DialogButton>
                                <DialogButton primary onClick={onLeave} style={{ flex: 1 }}>Thank you →</DialogButton>
                            </div>
                        </>
                    )}

                    {step === 'choose' && creditInfo && (
                        <LoanChooser
                            amount={amount} setAmount={setAmount}
                            term={term} setTerm={setTerm}
                            maxLoan={creditInfo.maxLoan}
                            quote={quote}
                            loading={loading}
                            onRequest={goReview}
                            onCancel={backToWelcome}
                        />
                    )}

                    {step === 'review' && quote && (
                        <>
                            <LoanSummary quote={quote} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <DialogButton onClick={() => { setStep('choose'); say('No problem — adjust the amount however you like.'); }}
                                              style={{ flex: 1 }}>
                                    ← Change
                                </DialogButton>
                                <DialogButton primary disabled={loading} onClick={confirmLoan} style={{ flex: 2 }}>
                                    {loading ? 'Processing…' : 'Confirm loan'}
                                </DialogButton>
                            </div>
                        </>
                    )}

                    {step === 'done' && granted && (
                        <>
                            <div style={grantBoxStyle}>
                                <div style={{ fontSize: 13, color: 'var(--text-muted, #8a96a3)' }}>Deposited</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-gold, #ffc857)' }}>
                                    + {euro(granted.principal)}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)', marginTop: 4 }}>
                                    Total to repay {euro(granted.totalRepayable)} over {granted.termTicks} days
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <DialogButton onClick={backToWelcome} style={{ flex: 1 }}>Take another</DialogButton>
                                <DialogButton primary onClick={onLeave} style={{ flex: 1 }}>Thank you →</DialogButton>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoanChooser({ amount, setAmount, term, setTerm, maxLoan, quote, loading, onRequest, onCancel }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
                <div style={labelRow}>
                    <span style={fieldLabel}>Amount</span>
                    <span style={{ color: 'var(--color-gold, #ffc857)', fontWeight: 700 }}>{euro(amount)}</span>
                </div>
                <input
                    type="range" min={1000} max={maxLoan} step={1000}
                    value={amount} onChange={e => setAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#ffc857' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted, #8a96a3)' }}>
                    <span>{euro(1000)}</span>
                    <span>Limit {euro(maxLoan)}</span>
                </div>
            </div>

            <div>
                <span style={fieldLabel}>Term</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {TERMS.map(t => (
                        <button key={t.ticks} onClick={() => setTerm(t.ticks)}
                                style={{
                                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                                    border: '1px solid ' + (term === t.ticks ? 'rgba(255,200,87,0.8)' : 'rgba(255,255,255,0.15)'),
                                    background: term === t.ticks ? 'rgba(255,200,87,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: term === t.ticks ? 'var(--color-gold, #ffc857)' : 'var(--text-muted, #b8c4d0)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                            {t.label}<br /><span style={{ fontSize: 10, opacity: 0.8 }}>{t.ticks} days</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={quoteBoxStyle}>
                {quote ? (
                    <>
                        <QuoteRow label="Interest rate" value={`${(quote.interestRate * 100).toFixed(1)} %`} />
                        <QuoteRow label="Total to repay" value={euro(quote.totalRepayable)} />
                        <QuoteRow label="Per day" value={euro(quote.tickPayment)} />
                    </>
                ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)' }}>Calculating terms…</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <DialogButton onClick={onCancel} style={{ flex: 1 }}>Cancel</DialogButton>
                <DialogButton primary disabled={loading || !quote?.approved} onClick={onRequest} style={{ flex: 2 }}>
                    Review terms →
                </DialogButton>
            </div>
        </div>
    );
}

function LoanSummary({ quote }) {
    return (
        <div style={quoteBoxStyle}>
            <QuoteRow label="Loan amount"    value={euro(quote.amount)} />
            <QuoteRow label="Term"           value={`${quote.termTicks} days`} />
            <QuoteRow label="Interest rate"  value={`${(quote.interestRate * 100).toFixed(1)} %`} />
            <QuoteRow label="Total to repay" value={euro(quote.totalRepayable)} highlight />
        </div>
    );
}

function ShipPicker({ options, onPick, onCancel }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '40vh', overflowY: 'auto' }}>
                {options.map(opt => (
                    <button
                        key={opt.shipId}
                        onClick={() => opt.eligible && onPick(opt)}
                        disabled={!opt.eligible}
                        title={opt.eligible ? `Mortgage the ${opt.shipName}` : opt.ineligibleReason}
                        style={{
                            textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                            cursor: opt.eligible ? 'pointer' : 'not-allowed',
                            border: '1px solid ' + (opt.eligible ? 'rgba(255,200,87,0.4)' : 'rgba(255,255,255,0.12)'),
                            background: opt.eligible ? 'rgba(255,200,87,0.08)' : 'rgba(255,255,255,0.03)',
                            color: '#e8eef5', opacity: opt.eligible ? 1 : 0.55,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{opt.shipName}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)' }}>worth {euro(opt.shipValue)}</span>
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4, color: opt.eligible ? 'var(--color-gold, #ffc857)' : 'var(--text-muted, #8a96a3)' }}>
                            {opt.eligible ? `Borrow up to ${euro(opt.maxMortgage)}` : opt.ineligibleReason}
                        </div>
                    </button>
                ))}
            </div>
            <DialogButton onClick={onCancel}>Cancel</DialogButton>
        </div>
    );
}

function MortgageChooser({ ship, amount, setAmount, term, setTerm, quote, loading, onRequest, onCancel }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)' }}>
                Collateral: <strong style={{ color: '#e8eef5' }}>{ship.shipName}</strong> · valued at {euro(ship.shipValue)}
            </div>
            <div>
                <div style={labelRow}>
                    <span style={fieldLabel}>Amount</span>
                    <span style={{ color: 'var(--color-gold, #ffc857)', fontWeight: 700 }}>{euro(amount)}</span>
                </div>
                <input
                    type="range" min={1000} max={ship.maxMortgage} step={100}
                    value={amount} onChange={e => setAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#ffc857' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted, #8a96a3)' }}>
                    <span>{euro(1000)}</span>
                    <span>Max {euro(ship.maxMortgage)}</span>
                </div>
            </div>

            <div>
                <span style={fieldLabel}>Term</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {TERMS.map(t => (
                        <button key={t.ticks} onClick={() => setTerm(t.ticks)}
                                style={{
                                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                                    border: '1px solid ' + (term === t.ticks ? 'rgba(255,200,87,0.8)' : 'rgba(255,255,255,0.15)'),
                                    background: term === t.ticks ? 'rgba(255,200,87,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: term === t.ticks ? 'var(--color-gold, #ffc857)' : 'var(--text-muted, #b8c4d0)',
                                    fontSize: 11, fontWeight: 600,
                                }}>
                            {t.label}<br /><span style={{ fontSize: 10, opacity: 0.8 }}>{t.ticks} days</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={quoteBoxStyle}>
                {quote ? (
                    <>
                        <QuoteRow label="Interest rate" value={`${(quote.interestRate * 100).toFixed(1)} %`} />
                        <QuoteRow label="Total to repay" value={euro(quote.totalRepayable)} />
                        <QuoteRow label="Per day" value={euro(quote.tickPayment)} />
                    </>
                ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted, #8a96a3)' }}>Calculating terms…</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <DialogButton onClick={onCancel} style={{ flex: 1 }}>Cancel</DialogButton>
                <DialogButton primary disabled={loading || !quote?.approved} onClick={onRequest} style={{ flex: 2 }}>
                    Review terms →
                </DialogButton>
            </div>
        </div>
    );
}

function MortgageSummary({ quote }) {
    return (
        <div style={quoteBoxStyle}>
            <QuoteRow label="Ship"           value={quote.shipName} />
            <QuoteRow label="Mortgage amount" value={euro(quote.amount)} />
            <QuoteRow label="Term"           value={`${quote.termTicks} days`} />
            <QuoteRow label="Interest rate"  value={`${(quote.interestRate * 100).toFixed(1)} %`} />
            <QuoteRow label="Total to repay" value={euro(quote.totalRepayable)} highlight />
        </div>
    );
}

function QuoteRow({ label, value, highlight }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted, #8a96a3)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: highlight ? 'var(--color-gold, #ffc857)' : '#e8eef5' }}>{value}</span>
        </div>
    );
}

function SpeechBubble({ text }) {
    return (
        <div style={{
            position: 'relative', background: '#f5f1e6', color: '#1a1a1a',
            borderRadius: 14, padding: '16px 18px', fontSize: 15, lineHeight: 1.5,
            fontFamily: "'Georgia', serif", boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            animation: 'bubblePop 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
            {text}
            <div style={{
                position: 'absolute', right: -12, top: 28, width: 0, height: 0,
                borderTop: '10px solid transparent', borderBottom: '10px solid transparent',
                borderLeft: '14px solid #f5f1e6',
            }} />
        </div>
    );
}

function DialogButton({ children, onClick, primary, disabled, style }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '11px 16px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                border: '1px solid ' + (primary ? 'rgba(255,200,87,0.6)' : 'rgba(255,255,255,0.18)'),
                background: primary
                    ? 'linear-gradient(to bottom, rgba(255,200,87,0.95), rgba(214,166,40,0.95))'
                    : 'rgba(255,255,255,0.06)',
                color: primary ? '#1a1205' : '#e8eef5',
                fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
                opacity: disabled ? 0.5 : 1, textAlign: 'left',
                transition: 'transform 0.12s ease, background 0.15s ease',
                ...style,
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {children}
        </button>
    );
}

const stageWrapStyle = {
    position: 'absolute', inset: 0, display: 'flex',
    justifyContent: 'center', alignItems: 'flex-end',
    overflow: 'hidden', background: '#000',
};
const stageStyle = {
    position: 'relative', flexShrink: 0,
    width:  'max(100vw, calc(100vh * 16 / 9))',
    height: 'max(100vh, calc(100vw * 9 / 16))',
};

const closeBtnStyle = {
    position: 'absolute', top: 16, left: 16, zIndex: 20,
    width: 40, height: 40, borderRadius: '50%',
    border: '1px solid rgba(40,120,208,0.4)', background: 'rgba(4,9,15,0.72)',
    color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(6px)', boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
    transition: 'background 0.15s ease',
};

const captionStyle = {
    position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(4,9,15,0.7)', color: '#e8eef5', padding: '10px 18px',
    borderRadius: 10, fontSize: 14, maxWidth: '70%', textAlign: 'center',
    backdropFilter: 'blur(6px)', boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
};

const scrimStyle = {
    position: 'fixed', inset: 0, zIndex: 5,
    background: 'rgba(0,0,0,0.5)',
};

const panelStyle = {
    position: 'fixed', left: 'clamp(16px, 5vw, 96px)', top: '50%',
    transform: 'translateY(-50%)',
    width: 'min(440px, calc(100vw - 32px))',
    maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden',
    zIndex: 10,
    background: 'rgba(10,16,28,0.85)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 18,
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
};

const quoteBoxStyle = {
    background: 'rgba(4,9,15,0.65)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px',
};

const grantBoxStyle = {
    background: 'rgba(255,200,87,0.08)', border: '1px solid rgba(255,200,87,0.3)',
    borderRadius: 12, padding: '16px 18px', textAlign: 'center',
};

const labelRow   = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };
const fieldLabel = { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted, #8a96a3)', fontWeight: 700 };
