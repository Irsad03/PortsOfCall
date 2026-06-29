import {useState, useEffect, useRef, useCallback} from 'react';
import {useGame} from './context/GameContext';
import {useToast} from './context/ToastContext';
import {gameService} from './api/gameService';
import {ShipStatus, isAtSea} from './constants/ShipStatus';
import StartScreen from './components/StartScreen';
import LobbyView from './components/LobbyView';
import PortsOfCallLogo from './components/PortsOfCallLogo';
import HarbourView from './components/HarbourView';
import BrokerView from './components/BrokerView';
import OfficeView from './components/OfficeView';
import WorldMap from './components/Worldmap';
import Leaderboard from './components/Leaderboard';
import PilotModal from './components/PilotModal';
import EndGameModal from './components/EndGameModal';
import CustomsModal from './components/CustomsModal';
import InspectionResultModal from './components/InspectionResultModal';
import SmugglingOfferModal from './components/SmugglingOfferModal';
import MinigameView from './components/MinigameView';
import RatsMinigameView from './components/RatsMinigameView';
import ManOverboardView from './components/ManOverboardView';
import BankView from './components/BankView';
import {FocusTrap} from './components/FocusTrap';
import {getLastReadNewsTick} from './components/NewspaperView';
import './App.css';

export default function App() {
    const {pushToast} = useToast();
    const {
        sessionId, currentTick, lastTickTimestamp, tickIntervalMs,
        players, connected, error, activeShips, lastReward,
        leaveGame, newCreatorNotification, setNewCreatorNotification,
        isCreator, setIsCreator, endGameVote, gameOver, leaderboard,
        customsInspection, customsResult,
        minigameEvent, setMinigameEvent,
        lastContractFailure, setLastContractFailure,
        newspaperTarget, setNewspaperTarget,
    } = useGame();

    const [playerInfo, setPlayerInfo] = useState({
        sessionCode: null,
        myPlayerId: null,
        myPlayerName: null,
        isCreator: false,
    });

    const [gameStarted, setGameStarted] = useState(false);
    const [unloadedShips, setUnloadedShips] = useState(new Set());
    const [currentPort, setCurrentPort] = useState({id: null, name: null});
    const [currentView, setCurrentView] = useState('harbour');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [ports, setPorts] = useState([]);
    const [selectingHomePort, setSelectingHomePort] = useState(false);
    const [homePortError, setHomePortError] = useState(null);
    const [showArrivalModal, setShowArrivalModal] = useState(false);
    const [arrivalData, setArrivalData] = useState(null);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [ratsResult, setRatsResult] = useState(null);
    const [previewWaypoints, setPreviewWaypoints] = useState(null);
    const [previewIsAlternative, setPreviewIsAlternative] = useState(false);
    const [activeMinigameShipId, setActiveMinigameShipId] = useState(null);
    const [cargoFocus, setCargoFocus] = useState(null);
    const [lastReadNewsTick, setLastReadNewsTick] = useState(0);
    const [newsUnread, setNewsUnread] = useState(0);

    const myPlayer = players.find(p => p.playerId === playerInfo.myPlayerId);
    const prevStatusRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (gameStarted) {
            gameService.getPorts().then(setPorts).catch(console.error);
        }
    }, [gameStarted]);

    useEffect(() => {
        if (sessionId) setLastReadNewsTick(getLastReadNewsTick(sessionId));
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId || !gameStarted) return;
        let cancelled = false;
        gameService.getNews(sessionId, {sinceTick: lastReadNewsTick + 1, limit: 25})
            .then(items => { if (!cancelled) setNewsUnread(items?.length ?? 0); })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [sessionId, gameStarted, currentTick, lastReadNewsTick]);

    const handleNewsRead = useCallback((tick) => {
        setLastReadNewsTick(prev => Math.max(prev, tick));
    }, []);

    useEffect(() => {
        if (newspaperTarget && gameStarted && currentPort.id) {
            setCurrentView('news');
        }
    }, [newspaperTarget, gameStarted, currentPort.id]);

    useEffect(() => {
        if (!myPlayer?.currentPortId || currentPort.id) return;
        const port = ports.find(p => p.id === myPlayer.currentPortId);
        setCurrentPort({
            id: myPlayer.currentPortId,
            name: port?.name ?? 'Home Port',
        });
    }, [myPlayer?.currentPortId, currentPort.id, ports]);

    useEffect(() => {
        if (myPlayer) {
            const prev = prevStatusRef.current;
            const arrived =
                myPlayer.shipStatus === ShipStatus.IDLE &&
                myPlayer.currentPortId &&
                isAtSea(prev);

            if (arrived) {
                const port = ports.find(p => p.id === myPlayer.currentPortId);
                const pName = port ? port.name : 'Unknown Port';
                setCurrentPort({id: myPlayer.currentPortId, name: pName});
                setCurrentView('harbour');
                setIsSidebarOpen(true);
            }

            const departed = myPlayer.shipStatus === ShipStatus.IN_TRANSIT && prev === ShipStatus.IDLE;
            if (departed && myPlayer.currentShip?.id) {
                setUnloadedShips(prev => {
                    const next = new Set(prev);
                    next.delete(myPlayer.currentShip.id);
                    return next;
                });
            }

            prevStatusRef.current = myPlayer.shipStatus;
        }
    }, [myPlayer?.shipStatus, myPlayer?.currentPortId, myPlayer?.currentShip?.lastVoyageProfit, ports]);

    useEffect(() => {
        if (!lastReward || lastReward.playerId !== playerInfo.myPlayerId) return;
        const port = ports.find(p => p.id === myPlayer?.currentPortId);
        setArrivalData({
            portName: port?.name ?? 'Destination Port',
            profit: lastReward.profit
        });
        setShowArrivalModal(true);
    }, [lastReward]);

    const myContractFailure = null;

    useEffect(() => {
        if (
            lastContractFailure &&
            lastContractFailure.playerId === playerInfo.myPlayerId &&
            lastContractFailure.reason === 'FORFEITED'
        ) {
            setLastContractFailure(null);
        }
    }, [lastContractFailure, playerInfo.myPlayerId, setLastContractFailure]);

    useEffect(() => {
        if (
            lastContractFailure &&
            lastContractFailure.playerId === playerInfo.myPlayerId &&
            lastContractFailure.reason === 'DEADLINE_EXPIRED'
        ) {
            const f = lastContractFailure;
            const lateTicks = f.lateTicks ?? 0;
            const lateMsg = lateTicks > 0
                ? ` ${lateTicks} day${lateTicks === 1 ? '' : 's'} late × 80🪙 = −${f.penalty.toLocaleString()}🪙 from wage.`
                : (f.penalty > 0 ? ` Deduction: − ${f.penalty.toLocaleString()}🪙.` : '');
            pushToast({
                type: 'warning',
                title: 'Too late!',
                message: `Deadline missed: "${f.description ?? 'Cargo contract'}".${lateMsg}`,
                ttl: 8000,
            });
            setLastContractFailure(null);
        }
    }, [lastContractFailure, playerInfo.myPlayerId, pushToast, setLastContractFailure]);

    const isValidSessionPlayer = Boolean(myPlayer);

    const shipNameOf = (shipId) =>
        activeShips.find(s => s.shipId === shipId)?.shipName
        ?? (myPlayer?.currentShip?.id === shipId ? myPlayer.currentShip.name : null)
        ?? 'your ship';

    useEffect(() => {
        if (!endGameVote?.started) {
            return;
        }
        setShowEndGameModal(isValidSessionPlayer);
    }, [endGameVote?.started, isValidSessionPlayer]);

    useEffect(() => {
        if (newCreatorNotification && newCreatorNotification.creatorId === playerInfo.myPlayerId) {
            setPlayerInfo(prev => ({...prev, isCreator: true}));
            setIsCreator(true);
        }
    }, [newCreatorNotification, playerInfo.myPlayerId, setIsCreator]);

    const endGameCooldownActive = endGameVote?.cooldownUntil && Date.now() < endGameVote.cooldownUntil;

    const isSailing = myPlayer && myPlayer.shipStatus === ShipStatus.IN_TRANSIT;

    const isSelectingHomePort = gameStarted && !currentPort.id;

    async function handleSelectHomePort(port) {
        try {
            setSelectingHomePort(true);
            setHomePortError(null);
            let playerId = playerInfo.myPlayerId;

            if (!playerId && sessionId && playerInfo.myPlayerName) {
                const sessionPlayers = await gameService.getSessionPlayers(sessionId);
                const resolved = sessionPlayers?.find(p => p.name === playerInfo.myPlayerName);
                if (resolved?.id) {
                    playerId = resolved.id;
                    setPlayerInfo(prev => ({...prev, myPlayerId: resolved.id}));
                }
            }

            if (!playerId) {
                setHomePortError('Could not resolve player id. Please rejoin the lobby.');
                return;
            }

            await gameService.setHomePort(playerId, port.id);
            setCurrentPort({id: port.id, name: port.name});
            setIsSidebarOpen(true);
        } catch (err) {
            setHomePortError(err.message || 'Failed to set home port');
            console.error('Failed to set home port:', err);
        } finally {
            setSelectingHomePort(false);
        }
    }

    async function handlePreviewRoute(fromPortId, toPortId) {
        if (!fromPortId || !toPortId) {
            setPreviewWaypoints(null);
            setPreviewIsAlternative(false);
            return;
        }
        try {
            const route = await gameService.findRoute(fromPortId, toPortId);
            const useAlt = route?.blocked
                && route?.blockType === 'ROUTE'
                && Array.isArray(route?.alternativeWaypoints)
                && route.alternativeWaypoints.length > 1;
            setPreviewWaypoints(useAlt ? route.alternativeWaypoints : (route?.waypoints ?? null));
            setPreviewIsAlternative(useAlt);
        } catch (err) {
            console.error('Route preview failed:', err);
            setPreviewWaypoints(null);
            setPreviewIsAlternative(false);
        }
    }

    useEffect(() => { setPreviewWaypoints(null); setPreviewIsAlternative(false); }, [currentPort.id]);

    function handleMapPortClick(port) {
        if (isSelectingHomePort) {
            handleSelectHomePort(port);
        } else {
            setCurrentPort({id: port.id, name: port.name});
            setCurrentView('harbour');
            setIsSidebarOpen(true);
        }
    }

    if (!sessionId) {
        return (
            <main className="app-container preauth">
                <PortsOfCallLogo/>
                <StartScreen onSessionData={setPlayerInfo}/>
            </main>
        );
    }

    if (sessionId && !gameStarted) {
        return (
            <main className="app-container preauth">
                <PortsOfCallLogo/>
                <LobbyView
                    sessionCode={playerInfo.sessionCode}
                    myPlayerId={playerInfo.myPlayerId}
                    myPlayerName={playerInfo.myPlayerName}
                    isCreator={playerInfo.isCreator}
                    onGameStarted={() => setGameStarted(true)}
                />
            </main>
        );
    }

    if (gameOver) {
        return (
            <main className="app-container game-over">
                <div className="card" style={{maxWidth: '600px', margin: 'auto'}}>
                    <h1 style={{textAlign: 'center', marginBottom: '2rem'}}>Game Over</h1>
                    <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>Final Leaderboard</h2>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Captain</th>
                            <th>Net Worth</th>
                        </tr>
                        </thead>
                        <tbody>
                        {leaderboard.map((player, index) => (
                            <tr key={index} className={player.name === playerInfo.myPlayerName ? 'my-row' : ''}>
                                <td>{index + 1}</td>
                                <td>{player.name}</td>
                                <td style={{color: 'var(--color-gold)'}}>{player.money?.toLocaleString()}🪙</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                        style={{width: '100%', padding: '12px', marginTop: '2rem'}}
                    >
                        Back to Main Menu
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="app-container game">

            <header className="hud-topbar">
                <div className="hud-brand"><span className="hud-brand-text">Ports of Call</span></div>

                <div className="hud-divider"/>

                <div className="hud-stat">
                    <span className="hud-label">SESSION</span>
                    <span className="hud-value">{playerInfo.sessionCode}</span>
                </div>

                <div className="hud-stat">
                    <span className="hud-label">DAY</span>
                    <span className="hud-value">{currentTick}</span>
                </div>

                <div className="hud-stat">
                    <span className="hud-label">CAPTAIN</span>
                    <span className="hud-value">
                        <span className={`status-dot ${connected ? 'online' : 'offline'}`}/>
                        {playerInfo.myPlayerName}
                    </span>
                </div>

                {myPlayer && (
                    <div className="hud-stat">
                        <span className="hud-label">BALANCE</span>
                        <span className="hud-value hud-money">{myPlayer.money?.toLocaleString()}🪙</span>
                    </div>
                )}

                {isSailing && <span className="sailing-badge">AT SEA</span>}
                {myPlayer?.shipStatus === 'CUSTOMS_HOLD' && (() => {
                    const cs = myPlayer?.currentShip?.customsStatus;
                    const ticks = myPlayer?.currentShip?.customsHoldRemainingTicks ?? 0;
                    const bg = cs === 'PENALIZED' ? 'rgba(244,67,54,0.15)'
                        : cs === 'PROCESSING' ? 'rgba(33,150,243,0.15)'
                            : 'rgba(255,160,0,0.15)';
                    const col = cs === 'PENALIZED' ? '#ef5350'
                        : cs === 'PROCESSING' ? '#90caf9'
                            : '#ffa000';
                    const bdr = cs === 'PENALIZED' ? 'rgba(244,67,54,0.4)'
                        : cs === 'PROCESSING' ? 'rgba(33,150,243,0.4)'
                            : 'rgba(255,160,0,0.4)';
                    const label = cs === 'PENALIZED' ? 'PENALIZED'
                        : cs === 'PROCESSING' ? 'REVIEW'
                            : 'CUSTOMS';
                    return (
                        <span className="sailing-badge" style={{background: bg, color: col, borderColor: bdr}}>
                            {label}{ticks > 0 && <> — {ticks}d</>}
                        </span>
                    );
                })()}

                <div className="hud-spacer"/>

                {isCreator && (
                    <button
                        className="btn btn-danger"
                        onClick={() => {
                            if (endGameVote?.started || endGameCooldownActive) return;
                            setShowEndGameModal(true);
                        }}
                        disabled={endGameVote?.started || endGameCooldownActive}
                        style={{
                            marginRight: '8px',
                            opacity: endGameVote?.started || endGameCooldownActive ? 0.45 : 1,
                            cursor: endGameVote?.started || endGameCooldownActive ? 'not-allowed' : 'pointer'
                        }}
                        title={endGameVote?.started ? 'Vote is already running' : endGameCooldownActive ? 'Cooldown active — try again later' : 'End the game'}
                    >
                        End Game
                    </button>
                )}

                <button
                    className="btn btn-danger hud-leave-btn"
                    onClick={() => setShowLeaveConfirm(true)}
                    title="Leave game session"
                    style={{marginRight: '8px'}}
                >
                    Leave Game
                </button>

                {currentPort.id && (
                    <button
                        className="btn btn-secondary hud-toggle-btn"
                        onClick={() => setIsSidebarOpen(v => !v)}
                    >
                        {isSidebarOpen ? 'Close' : 'Menu'}
                    </button>
                )}
            </header>

            <div className="map-area">
                <WorldMap
                    ref={mapRef}
                    ports={ports}
                    onSelectPort={handleMapPortClick}
                    loading={selectingHomePort}
                    activeShips={activeShips}
                    myPlayerId={playerInfo.myPlayerId}
                    lastTickTimestamp={lastTickTimestamp}
                    tickIntervalMs={tickIntervalMs}
                    isSelectingPort={isSelectingHomePort}
                    previewWaypoints={previewWaypoints}
                    previewIsAlternative={previewIsAlternative}
                />

                <div className="map-corner">
                    <div className="map-zoom-controls">
                        <button type="button" aria-label="Zoom in"    onClick={() => mapRef.current?.zoomIn()}    title="Zoom in">+</button>
                        <button type="button" aria-label="Zoom out"   onClick={() => mapRef.current?.zoomOut()}   title="Zoom out">−</button>
                        <button type="button" aria-label="Reset view" onClick={() => mapRef.current?.resetView()} title="Reset view">⟳</button>
                    </div>
                    <Leaderboard players={players} myPlayerId={playerInfo.myPlayerId} />
                </div>

                {isSelectingHomePort && (
                    <div className="port-selection-banner">
                        <div className="port-selection-banner-inner">
                            <div className="port-selection-icon"></div>
                            <div>
                                <h3 className="port-selection-title">Choose Your Home Port</h3>
                                <p className="port-selection-subtitle">Click a port marker — or press Tab / arrow
                                    keys and Enter — to begin your voyage</p>
                                {homePortError &&
                                    <p className="text-danger" style={{marginTop: '6px'}}>{homePortError}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {currentPort.id && (
                    <aside className={`sidebar-overlay ${isSidebarOpen ? '' : 'collapsed'}`}>

                        <div className="sidebar-header">
                            <div className="sidebar-nav">
                                <button
                                    className={`sidebar-tab ${currentView === 'harbour' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('harbour')}
                                >Harbour
                                </button>
                                <button
                                    className={`sidebar-tab ${currentView === 'broker' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('broker')}
                                >Broker
                                </button>
                                <button
                                    className={`sidebar-tab ${currentView === 'office' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('office')}
                                >Office
                                </button>
                                <button
                                    className={`sidebar-tab ${currentView === 'bank' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('bank')}
                                >Bank
                                </button>
                                <button
                                    className={`sidebar-tab ${currentView === 'news' ? 'active' : ''}`}
                                    onClick={() => setCurrentView('news')}
                                    style={{position: 'relative'}}
                                >News
                                    {newsUnread > 0 && (
                                        <span style={{
                                            position: 'absolute', top: -6, right: -4,
                                            minWidth: 18, height: 18, padding: '0 5px',
                                            borderRadius: 9, background: '#dc2626', color: '#fff',
                                            fontSize: 10, fontWeight: 800, lineHeight: '18px',
                                            textAlign: 'center',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                            boxSizing: 'border-box',
                                        }}>
                                            {newsUnread > 24 ? '25+' : newsUnread}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-danger sidebar-error">{error}</p>}

                        <div className="sidebar-content">
                            <>
                                {currentView === 'harbour' && (
                                    <HarbourView
                                        portId={currentPort.id}
                                        portName={currentPort.name}
                                        playerId={playerInfo.myPlayerId}
                                        sessionId={sessionId}
                                        ports={ports}
                                        onPortChange={(port) => setCurrentPort({id: port.id, name: port.name})}
                                        unloadedShips={unloadedShips}
                                        onShipUnloaded={(shipId) => setUnloadedShips(prev => new Set([...prev, shipId]))}
                                        onPreviewRoute={handlePreviewRoute}
                                        onContractClick={(contractId, shipId) => {
                                            setCargoFocus({ contractId, shipId });
                                            setCurrentView('office');
                                        }}
                                    />
                                )}
                                {currentView === 'broker' && (
                                    <BrokerView
                                        myPlayerId={playerInfo.myPlayerId}
                                        onBack={() => setCurrentView('harbour')}
                                    />
                                )}
                                {currentView === 'office' && (
                                    <OfficeView
                                        portId={currentPort.id}
                                        sessionId={sessionId}
                                        myPlayerId={playerInfo.myPlayerId}
                                        currentPortName={currentPort.name}
                                        ports={ports}
                                        onBack={() => { setCargoFocus(null); setCurrentView('harbour'); }}
                                        cargoFocus={cargoFocus}
                                        newsUnread={newsUnread}
                                        onNewsRead={handleNewsRead}
                                    />
                                )}
                                {currentView === 'news' && (
                                    <OfficeView
                                        portId={currentPort.id}
                                        sessionId={sessionId}
                                        myPlayerId={playerInfo.myPlayerId}
                                        currentPortName={currentPort.name}
                                        ports={ports}
                                        onBack={() => { setNewspaperTarget(null); setCurrentView('harbour'); }}
                                        cargoFocus={null}
                                        newsFocus={{headline: newspaperTarget?.headline ?? null}}
                                        newsUnread={newsUnread}
                                        onNewsRead={handleNewsRead}
                                    />
                                )}
                                {currentView === 'bank' && (
                                    <BankView
                                        myPlayerId={playerInfo.myPlayerId}
                                        onBack={() => setCurrentView('harbour')}
                                        onTaxi={() => setCurrentView('office')}
                                    />
                                )}
                            </>
                        </div>
                    </aside>
                )}

                {currentView === 'minigame' && (
                    <MinigameView
                        onExit={() => {
                            const shipId = activeMinigameShipId ?? myPlayer?.currentShip?.id;
                            setActiveMinigameShipId(null);
                            setCurrentView('harbour');
                            if (shipId && sessionId) {
                                gameService.finishMinigame(sessionId, shipId)
                                    .catch(err => console.error('Failed to finish minigame:', err));
                            }
                        }}
                        shipId={activeMinigameShipId ?? myPlayer?.currentShip?.id}
                    />
                )}
                {currentView === 'rats-minigame' && (
                    <RatsMinigameView
                        onFinish={(success) => {
                            const shipId = activeMinigameShipId ?? minigameEvent?.shipId ?? myPlayer?.currentShip?.id;
                            setActiveMinigameShipId(null);
                            if (shipId) setMinigameEvent(shipId);
                            setCurrentView('harbour');
                            if (shipId) {
                                gameService.finishRatsMinigame(shipId, success)
                                    .then(result => setRatsResult(result))
                                    .catch(err => console.error('Failed to finish rats minigame:', err));
                            }
                        }}
                    />
                )}
                {currentView === 'man-overboard' && (
                    <ManOverboardView
                        onExit={({success, rescueTimeMs} = {}) => {
                            const shipId = activeMinigameShipId ?? myPlayer?.currentShip?.id;
                            setActiveMinigameShipId(null);
                            setCurrentView('harbour');
                            if (shipId) {
                                gameService.finishOverboardMinigame(shipId, success, rescueTimeMs)
                                    .catch(err => console.error('Failed to finish overboard minigame:', err));
                            }
                        }}
                    />
                )}
            </div>

            {minigameEvent
                && currentView !== 'minigame'
                && currentView !== 'rats-minigame'
                && currentView !== 'man-overboard'
                && (() => {
                    if (minigameEvent.eventType === 'RATS_ON_BOARD') {
                        const cables = minigameEvent.variant === 'CABLES';
                        const shipName = shipNameOf(minigameEvent.shipId);
                        return (
                            <div className="modal-overlay">
                                <FocusTrap className="modal-content card" style={{maxWidth: '420px'}}>
                                    <div className="modal-icon"></div>
                                    <h2>{cables ? `Rats chewing the cables on ${shipName}!` : `Rats on board ${shipName}!`}</h2>
                                    <p style={{margin: '12px 0 24px', color: 'var(--color-text-muted)'}}>
                                        {cables
                                            ? 'With no cargo to eat, the rats have found your electrical wiring. Every day gnaws away at your ship\'s hull. Launch the extermination minigame to stop them.'
                                            : 'A rat infestation has broken out in the cargo hold. They are eating through your cargo — every day reduces its value. Launch the extermination minigame to get rid of them.'}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        style={{width: '100%', padding: '12px'}}
                                        autoFocus
                                        onClick={() => {
                                            setActiveMinigameShipId(minigameEvent.shipId);
                                            setCurrentView('rats-minigame');
                                        }}
                                    >
                                        Exterminate rats
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{width: '100%', padding: '10px', marginTop: '8px'}}
                                        onClick={() => setMinigameEvent(minigameEvent.shipId)}
                                    >
                                        {cables ? 'Later (keep losing HP)' : 'Later (keep losing cargo)'}
                                    </button>
                                </FocusTrap>
                            </div>
                        );
                    }

                    const isOverboard = minigameEvent.eventType === 'MAN_OVERBOARD';
                    const icon = '';
                    const shipName = shipNameOf(minigameEvent.shipId);
                    const title = isOverboard ? `Man Overboard on ${shipName}!` : `Captain, ${shipName} has a situation!`;
                    const body = isOverboard
                        ? `A crew member of ${shipName} has fallen into the sea! Launch the rescue boat and bring them back before it's too late.`
                        : `${shipName} encountered ${minigameEvent.eventType} on its route! You need to take the helm and navigate manually to avoid them.`;
                    const cta = isOverboard ? 'Start Rescue' : 'Start Minigame';

                    return (
                        <div className="modal-overlay">
                            <FocusTrap className="modal-content card" style={{maxWidth: '420px'}}>
                                <div className="modal-icon">{icon}</div>
                                <h2>{title}</h2>
                                <p style={{margin: '12px 0 24px', color: 'var(--color-text-muted)'}}>
                                    {body}
                                </p>
                                <button
                                    className="btn btn-primary"
                                    style={{width: '100%', padding: '12px'}}
                                    autoFocus
                                    onClick={async () => {
                                        const targetShipId = minigameEvent.shipId;
                                        try {
                                            await gameService.startMinigame(sessionId, targetShipId);
                                        } catch (err) {
                                            console.error('Failed to start minigame:', err);
                                            return;
                                        }
                                        setActiveMinigameShipId(targetShipId);
                                        setCurrentView(isOverboard ? 'man-overboard' : 'minigame');
                                        setMinigameEvent(targetShipId);
                                    }}
                                >
                                    {cta}
                                </button>
                            </FocusTrap>
                        </div>
                    );
                })()}

            {ratsResult && (() => {
                const cables = ratsResult.mode === 'CABLES';
                const heading = ratsResult.success
                    ? (cables ? 'Wiring secured' : 'Cargo hold cleared')
                    : (cables ? 'Hull damaged' : 'Cargo damaged');
                const totalLabel = cables
                    ? `Total hull damage this incident: − ${ratsResult.totalDamagePercent} HP`
                    : `Total cargo value loss this incident: − ${ratsResult.totalDamagePercent}%`;
                return (
                    <div className="modal-overlay">
                        <FocusTrap className="modal-content card" style={{maxWidth: '420px'}}>
                            <div className="modal-icon"></div>
                            <h2>{heading}</h2>
                            <p style={{margin: '12px 0 8px', color: 'var(--color-text-muted)'}}>
                                {ratsResult.message}
                            </p>
                            {ratsResult.totalDamagePercent > 0 && (
                                <p style={{margin: '0 0 18px', color: '#ff9a9a', fontSize: '13px'}}>
                                    {totalLabel}
                                </p>
                            )}
                            <button
                                className="btn btn-primary"
                                style={{width: '100%', padding: '12px'}}
                                onClick={() => setRatsResult(null)}
                                autoFocus
                            >
                                Continue
                            </button>
                        </FocusTrap>
                    </div>
                );
            })()}

            {showArrivalModal && arrivalData && (
                <div className="modal-overlay">
                    <FocusTrap className="modal-content card">
                        <div className="modal-icon"></div>
                        <h2>Voyage Complete!</h2>
                        <p style={{fontSize: '1.1rem', margin: '12px 0 20px'}}>
                            Safely arrived at <strong>{arrivalData.portName}</strong>
                        </p>
                        <div className="voyage-report">
                            <h4>Voyage Report</h4>
                            {arrivalData.profit > 0 ? (
                                <p className="profit-positive">+ {arrivalData.profit.toLocaleString()}🪙</p>
                            ) : (
                                <p className="profit-zero">0🪙 — No cargo transported</p>
                            )}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowArrivalModal(false)}
                            style={{width: '100%', padding: '12px', marginTop: '8px'}}
                            autoFocus
                        >
                            Enter Port
                        </button>
                    </FocusTrap>
                </div>
            )}

            {myContractFailure && (
                <div className="modal-overlay">
                    <div className="modal-content card">
                        <div className="modal-icon"></div>
                        <h2>Contract Failed</h2>
                        <p style={{fontSize: '1.05rem', margin: '12px 0 8px'}}>
                            <strong>{myContractFailure.description ?? 'Cargo contract'}</strong>
                        </p>
                        <p style={{color: '#888', marginBottom: '16px'}}>
                            {myContractFailure.reason === 'DEADLINE_EXPIRED'
                                ? 'The deadline has passed.'
                                : 'You forfeited this contract.'}
                        </p>
                        <div className="voyage-report">
                            <h4>Penalty Applied</h4>
                            <p className="profit-negative" style={{color: '#c0392b'}}>
                                − {myContractFailure.penalty.toLocaleString()}🪙
                            </p>
                            <p style={{fontSize: '0.9rem', color: '#666'}}>
                                New balance: {myContractFailure.newBalance.toLocaleString()}🪙
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setLastContractFailure(null)}
                            style={{width: '100%', padding: '12px', marginTop: '8px'}}
                        >
                            Acknowledge
                        </button>
                    </div>
                </div>
            )}

            <PilotModal myPlayerId={playerInfo.myPlayerId}/>

            <CustomsModal
                key={customsInspection?.shipId ? `customs-${customsInspection.shipId}` : 'customs-idle'}
                myPlayerId={playerInfo.myPlayerId}
                players={players}
            />
            <InspectionResultModal key={customsResult ? 'inspection-result' : 'inspection-idle'}/>
            <SmugglingOfferModal/>

            {showEndGameModal && (
                <EndGameModal
                    myPlayerId={playerInfo.myPlayerId}
                    sessionId={sessionId}
                    onClose={() => setShowEndGameModal(false)}
                />
            )}

            {showLeaveConfirm && (
                <div className="modal-overlay">
                    <FocusTrap className="modal-content card" style={{maxWidth: '420px'}}>
                        <div className="modal-icon"></div>
                        <h2>Leave game?</h2>
                        <p style={{margin: '12px 0 24px', color: 'var(--color-text-muted)'}}>
                            You are about to leave the current session. Your ships will be removed and
                            you will not be able to rejoin this game.
                        </p>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <button
                                className="btn btn-secondary"
                                style={{flex: 1, padding: '12px'}}
                                onClick={() => setShowLeaveConfirm(false)}
                                autoFocus
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{flex: 1, padding: '12px'}}
                                onClick={async () => {
                                    setShowLeaveConfirm(false);
                                    const myPlayerId = playerInfo.myPlayerId;
                                    await leaveGame(myPlayerId);
                                    setGameStarted(false);
                                    setCurrentPort({id: null, name: null});
                                    setCurrentView('harbour');
                                    setPlayerInfo({
                                        sessionCode: null,
                                        myPlayerId: null,
                                        myPlayerName: null,
                                        isCreator: false
                                    });
                                }}
                            >
                                Leave
                            </button>
                        </div>
                    </FocusTrap>
                </div>
            )}

            {newCreatorNotification && newCreatorNotification.creatorId === playerInfo.myPlayerId && currentPort.id && (
                <div className="modal-overlay">
                    <FocusTrap className="modal-content card" style={{maxWidth: '420px'}}>
                        <div className="modal-icon"></div>
                        <h2>You are now the host!</h2>
                        <p style={{margin: '12px 0 24px', color: 'var(--color-text-muted)'}}>
                            The previous host left the session. You now have the creator role.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{width: '100%', padding: '12px'}}
                            onClick={() => setNewCreatorNotification(null)}
                            autoFocus
                        >
                            Got it
                        </button>
                    </FocusTrap>
                </div>
            )}
        </main>
    );
}