import { useState, useEffect, useRef, useCallback } from 'react';
import { gameService } from '../api/gameService';
import { useGame } from '../context/GameContext';

const PAGE_SIZE = 25;

const readKey = (sessionId) => `pof:news:lastReadTick:${sessionId}`;
export function getLastReadNewsTick(sessionId) {
    try { return parseInt(localStorage.getItem(readKey(sessionId)), 10) || 0; }
    catch { return 0; }
}
function persistLastReadNewsTick(sessionId, tick) {
    try { localStorage.setItem(readKey(sessionId), String(tick)); } catch { }
}

const CATEGORY_META = {
    POLITICS: { label: 'Politics', icon: '', color: '#5b3a16' },
    MARKET:   { label: 'Market',   icon: '', color: '#1d4d2e' },
    INCIDENT: { label: 'Incident', icon: '', color: '#7a1f1f' },
    FINANCE:  { label: 'Finance',  icon: '', color: '#3b3270' },
};
const FILTERS = [
    { id: 'ALL', label: 'All News' },
    ...Object.entries(CATEGORY_META).map(([id, m]) => ({ id, label: m.label })),
];

const PAPER_BG = '#f3ead7';
const INK = '#2a2118';
const FADED_INK = '#6b5d49';
const RULE = '#b9a888';
const SERIF = "Georgia, 'Times New Roman', 'Palatino Linotype', serif";

export default function NewspaperView({ sessionId, currentTick, focusHeadline, onRead, onClose }) {
    const { lastPoliticalEvent } = useGame();
    const [articles, setArticles] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [exhausted, setExhausted] = useState(false);
    const [error, setError] = useState(null);
    const [flashId, setFlashId] = useState(null);
    const articleRefs = useRef({});
    const focusConsumedRef = useRef(false);
    const loadedCountRef = useRef(0);

    const fetchPage = useCallback(async (offset, limit) => {
        return gameService.getNews(sessionId, {
            category: filter === 'ALL' ? undefined : filter,
            limit,
            offset,
        });
    }, [sessionId, filter]);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchPage(0, PAGE_SIZE)
            .then(items => {
                if (cancelled) return;
                setArticles(items ?? []);
                setExhausted((items?.length ?? 0) < PAGE_SIZE);
            })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sessionId, fetchPage]);

    useEffect(() => { loadedCountRef.current = articles.length; }, [articles.length]);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        const limit = Math.max(PAGE_SIZE, loadedCountRef.current);
        fetchPage(0, limit)
            .then(items => {
                if (cancelled || !items) return;
                setArticles(items);
                if (items.length < limit) setExhausted(true);
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [sessionId, currentTick, lastPoliticalEvent, fetchPage]);

    useEffect(() => {
        if (articles.length === 0) return;
        const maxTick = Math.max(...articles.map(a => a.tick));
        if (maxTick > getLastReadNewsTick(sessionId)) {
            persistLastReadNewsTick(sessionId, maxTick);
        }
        onRead?.(maxTick);
    }, [articles, sessionId, onRead]);

    useEffect(() => { focusConsumedRef.current = false; }, [focusHeadline]);

    useEffect(() => {
        if (!focusHeadline || focusConsumedRef.current || articles.length === 0) return;
        const target = articles.find(a => a.headline === focusHeadline);
        if (!target) return;
        focusConsumedRef.current = true;
        setFlashId(target.id);
        requestAnimationFrame(() => {
            articleRefs.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        const t = setTimeout(() => setFlashId(null), 3500);
        return () => clearTimeout(t);
    }, [focusHeadline, articles]);

    async function loadMore() {
        setLoading(true);
        try {
            const more = await fetchPage(articles.length, PAGE_SIZE);
            setArticles(prev => [...prev, ...(more ?? [])]);
            setExhausted((more?.length ?? 0) < PAGE_SIZE);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }

    const [top, ...rest] = articles;
    const dateLine = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
            position: 'relative', zIndex: 3, animation: 'appIn 0.22s ease-out',
            background: PAPER_BG,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px 8px 14px',
                background: 'linear-gradient(to bottom,#8a6d3b,#6f5527)',
                color: '#f7efdd', borderBottom: '1px solid rgba(0,0,0,0.18)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                        The Harbour Gazette
                    </span>
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

            <div style={{
                flex: 1, overflowY: 'auto', minHeight: 0,
                fontFamily: SERIF, color: INK,
                background: `radial-gradient(ellipse at 50% 0%, #f8f1e0 0%, ${PAPER_BG} 55%, #eaddc2 100%)`,
                scrollbarWidth: 'thin', scrollbarColor: `${RULE} transparent`,
            }}>
                <div style={{ maxWidth: 980, margin: '0 auto', padding: '18px 28px 32px' }}>

                    <header style={{ textAlign: 'center', marginBottom: 10 }}>
                        <div style={{ borderTop: `3px double ${INK}`, borderBottom: `1px solid ${INK}`, padding: '10px 0 8px' }}>
                            <h1 style={{
                                margin: 0, fontSize: 'clamp(26px, 4.2vw, 46px)', fontWeight: 700,
                                letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1.05,
                                fontVariant: 'small-caps',
                            }}>
                                The Harbour Gazette
                            </h1>
                            <div style={{ fontStyle: 'italic', fontSize: 12.5, color: FADED_INK, marginTop: 4 }}>
                                All the news that sails the seven seas
                            </div>
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: `3px double ${INK}`, padding: '5px 2px', fontSize: 11.5,
                            textTransform: 'uppercase', letterSpacing: 1, color: FADED_INK,
                        }}>
                            <span>Session Edition</span>
                            <span>{dateLine}</span>
                            <span>Day No. {currentTick}</span>
                        </div>
                    </header>

                    <nav style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0 16px' }}>
                        {FILTERS.map(f => {
                            const active = filter === f.id;
                            return (
                                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                                    fontFamily: SERIF, fontSize: 12, letterSpacing: 1.2,
                                    textTransform: 'uppercase', cursor: 'pointer',
                                    padding: '4px 14px', borderRadius: 2,
                                    border: `1px solid ${active ? INK : RULE}`,
                                    background: active ? INK : 'transparent',
                                    color: active ? PAPER_BG : FADED_INK,
                                    transition: 'all 0.12s ease',
                                }}>
                                    {f.label}
                                </button>
                            );
                        })}
                    </nav>

                    {error && (
                        <div style={{ textAlign: 'center', color: '#7a1f1f', fontStyle: 'italic', marginBottom: 12 }}>
                            The printing press jammed: {error}
                        </div>
                    )}

                    {articles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: FADED_INK, fontStyle: 'italic', fontSize: 16 }}>
                            {loading ? 'Hot off the press…' : (
                                filter === 'ALL'
                                    ? 'No news yet — the seven seas are quiet today.'
                                    : 'Nothing to report in this section yet.'
                            )}
                        </div>
                    ) : (
                        <>
                            <Article
                                article={top}
                                big
                                flash={flashId === top.id}
                                innerRef={el => { articleRefs.current[top.id] = el; }}
                            />

                            {rest.length > 0 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    borderTop: `2px solid ${INK}`, paddingTop: 16, marginTop: 18,
                                }}>
                                    {rest.map((a, i) => (
                                        <Article
                                            key={a.id}
                                            article={a}
                                            divider={i > 0}
                                            flash={flashId === a.id}
                                            innerRef={el => { articleRefs.current[a.id] = el; }}
                                        />
                                    ))}
                                </div>
                            )}

                            {!exhausted && (
                                <div style={{ textAlign: 'center', marginTop: 22 }}>
                                    <button onClick={loadMore} disabled={loading} style={{
                                        fontFamily: SERIF, fontSize: 13, letterSpacing: 1,
                                        textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer',
                                        padding: '7px 22px', background: 'transparent',
                                        border: `1px solid ${INK}`, color: INK, borderRadius: 2,
                                    }}>
                                        {loading ? 'Printing…' : 'Load older editions'}
                                    </button>
                                </div>
                            )}

                            <footer style={{
                                textAlign: 'center', marginTop: 26, paddingTop: 8,
                                borderTop: `3px double ${INK}`, fontSize: 11, color: FADED_INK,
                                fontStyle: 'italic',
                            }}>
                                Printed aboard the editor's barge · The Harbour Gazette accepts no liability for ships lost following its advice
                            </footer>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes gazetteFlash {
                    0%   { background: rgba(200,154,32,0.45); }
                    100% { background: transparent; }
                }
            `}</style>
        </div>
    );
}

function Article({ article, big = false, divider = false, flash = false, innerRef }) {
    const meta = CATEGORY_META[article.category] ?? { label: article.category, icon: '', color: FADED_INK };
    return (
        <article
            ref={innerRef}
            style={{
                marginBottom: big ? 0 : 16,
                borderTop: divider ? `1px solid ${RULE}` : 'none',
                padding: big ? '14px 4px 4px' : (divider ? '16px 2px 0' : '0 2px 0'),
                animation: flash ? 'gazetteFlash 3.2s ease-out' : 'none',
                borderRadius: 3,
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.4,
                color: meta.color, fontWeight: 700, marginBottom: big ? 6 : 4,
            }}>
                <span>{meta.label}</span>
                <span style={{ color: FADED_INK, fontWeight: 400, letterSpacing: 0.6 }}>· Day {article.tick}</span>
            </div>
            <h2 style={{
                margin: '0 0 6px', fontWeight: 700, color: INK,
                fontSize: big ? 'clamp(22px, 3vw, 32px)' : 17,
                lineHeight: big ? 1.12 : 1.25,
                border: 'none', paddingLeft: 0,
            }}>
                {article.headline}
            </h2>
            {article.body && (
                <p style={{
                    margin: 0, fontSize: big ? 14.5 : 13, lineHeight: 1.55,
                    color: '#41382c', textAlign: 'justify', hyphens: 'auto',
                }}>
                    {article.body}
                </p>
            )}
        </article>
    );
}
