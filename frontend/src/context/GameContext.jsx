import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createStompClient } from '../websocket/stompClient';
import { gameService } from '../api/gameService';
import { useToast } from './ToastContext';

const routeKey = (fromPortId, toPortId) => `${fromPortId}|${toPortId}`;

const buildWsUrl = (path) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};

const WS_URLS = {
  session: buildWsUrl('/ws-session'),
  cargo:   buildWsUrl('/ws-cargo'),
  engine:  buildWsUrl('/ws-engine'),
};

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { pushToast } = useToast();
  const [sessionId, setSessionId] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [currentTick, setCurrentTick] = useState(0);
  const [players, setPlayers] = useState([]);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [pilotQueue, setPilotQueue] = useState([]);
  const [activeShips, setActiveShips] = useState([]);
  const clientRef = useRef(null);
  const [lastReward, setLastReward] = useState(null);
  const [newCreatorNotification, setNewCreatorNotification] = useState(null);
  const departedPlayerIdsRef = useRef(new Set());
  const [isCreator, setIsCreator] = useState(false);
  const [endGameVote, setEndGameVote] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [customsInspection, setCustomsInspection] = useState(null);
  const [customsResult, setCustomsResult] = useState(null);
  const [smugglingOffer, setSmugglingOffer] = useState(null);
  const [minigameQueue, setMinigameQueue] = useState([]);
  const [lastContractFailure, setLastContractFailure] = useState(null);
  const [blockedRouteKeys, setBlockedRouteKeys] = useState(() => new Set());
  const [alternativeRouteKeys, setAlternativeRouteKeys] = useState(() => new Set());
  const [lastPoliticalEvent, setLastPoliticalEvent] = useState(null);
  const [pilotStrikePortIds, setPilotStrikePortIds] = useState(() => new Set());
  const [newspaperTarget, setNewspaperTarget] = useState(null);

  const pilotRequest = pilotQueue[0] ?? null;
  const setPilotRequest = useCallback((value) => {
    setPilotQueue(prev => {
      if (value == null) return prev.slice(1);
      if (prev.some(r => r.shipId === value.shipId)) return prev;
      return [...prev, value];
    });
  }, []);

  const minigameEvent = minigameQueue[0] ?? null;
  const setMinigameEvent = useCallback((value) => {
    setMinigameQueue(prev => {
      if (value == null) return prev.slice(1);
      if (typeof value === 'string') return prev.filter(e => e.shipId !== value);
      if (prev.some(e => e.shipId === value.shipId && e.eventType === value.eventType)) return prev;
      return [...prev, value];
    });
  }, []);

  const sessionClientRef = useRef(null);
  const cargoClientRef = useRef(null);
  const engineClientRef = useRef(null);

  const updatePlayerState = useCallback((playerId, changes) => {
    setPlayers(prev => prev.map(p => p.playerId === playerId ? { ...p, ...changes } : p));
  }, []);

  const refreshMyBalance = useCallback(async (playerId) => {
    if (!playerId) return null;
    try {
      const fresh = await gameService.getPlayer(playerId);
      if (fresh && typeof fresh.money === 'number') {
        updatePlayerState(playerId, { money: fresh.money });
      }
      return fresh;
    } catch (err) {
      console.warn('refreshMyBalance failed:', err);
      return null;
    }
  }, [updatePlayerState]);

  useEffect(() => {
    if (!sessionId || !myPlayerId) return;

    gameService.getSessionPlayers(sessionId)
        .then(data => setLobbyPlayers(data ?? []))
        .catch(() => setLobbyPlayers([]));

    const ready = { session: false, cargo: false, engine: false };
    const updateConnected = () => {
      if (ready.session && ready.cargo && ready.engine) {
        setConnected(true);
        setError(null);
      }
    };
    const handleError = (msg) => {
      setError(msg);
      setConnected(false);
    };

    const sessionClient = createStompClient({
      url: WS_URLS.session,
      label: 'session',
      onError: handleError,
      onConnected: () => {
        ready.session = true;
        updateConnected();

        sessionClient.subscribe(`/topic/lobby/${sessionId}/players`, (msg) => {
          if (msg.event === "GAME_STARTED") {
            setGameStarted(true);
            return;
          }
          if (msg.event === "PLAYER_LEFT") {
            setLobbyPlayers(prev => prev.filter(p => p.name !== msg.playerName));
            if (msg.playerId) {
              departedPlayerIdsRef.current.add(msg.playerId);
              setPlayers(prev => prev.filter(p => p.playerId !== msg.playerId));
            } else {
              setPlayers(prev => prev.filter(p => p.name !== msg.playerName));
            }
            return;
          }
          if (msg.event === "NEW_CREATOR") {
            setNewCreatorNotification({ creatorId: msg.creatorId, creatorName: msg.creatorName });
            return;
          }
          if (msg.playerName) {
            setLobbyPlayers(prev => {
              if (prev.some(p => p.name === msg.playerName)) return prev;
              return [...prev, { name: msg.playerName }];
            });
          }
        });

        sessionClient.subscribe(`/topic/game/${sessionId}/end-game-vote`, (msg) => {
          if (msg.event === "END_GAME_VOTE_STARTED") {
            setEndGameVote({
              started: true,
              yesVotes: 0,
              totalVotes: 0,
              totalPlayers: msg.totalPlayers,
              cooldownUntil: null,
            });
          } else if (msg.event === "END_GAME_VOTE_UPDATE") {
            setEndGameVote(prev => ({
              ...prev,
              yesVotes: msg.yesVotes,
              totalVotes: msg.totalVotes,
            }));
          } else if (msg.event === "END_GAME_VOTE_CLOSED") {
            setEndGameVote({
              started: false,
              yesVotes: msg.yesVotes,
              totalVotes: msg.totalVotes,
              totalPlayers: msg.totalPlayers,
              cooldownUntil: msg.cooldownUntil,
            });
          }
        });

        sessionClient.subscribe(`/topic/game/${sessionId}/end-game`, (msg) => {
          if (msg.event === "GAME_OVER") {
            setGameOver(true);
            setLeaderboard(msg.leaderboard || []);
          }
        });
      },
    });

    const cargoClient = createStompClient({
      url: WS_URLS.cargo,
      label: 'cargo',
      onError: handleError,
      onConnected: () => {
        ready.cargo = true;
        updateConnected();

        cargoClient.subscribe(`/topic/game/${sessionId}/rewards`, (msg) => {
          setLastReward(msg);
          if (msg?.playerId && typeof msg.newBalance === 'number') {
            setPlayers(prev => prev.map(p =>
              p.playerId === msg.playerId ? { ...p, money: msg.newBalance } : p,
            ));
          }
        });

        cargoClient.subscribe(`/topic/game/${sessionId}/contract-failed`, (msg) => {
          setLastContractFailure(msg);
          if (msg?.playerId && typeof msg.newBalance === 'number') {
            setPlayers(prev => prev.map(p =>
              p.playerId === msg.playerId ? { ...p, money: msg.newBalance } : p,
            ));
          }
        });

        cargoClient.subscribe(`/topic/customs/${sessionId}/${myPlayerId}`, (msg) => {
          setCustomsInspection(msg);
        });

        cargoClient.subscribe(`/topic/customs/${sessionId}/${myPlayerId}/result`, (msg) => {
          setCustomsInspection(null);
          setCustomsResult(msg);
        });
      },
    });

    const engineClient = createStompClient({
      url: WS_URLS.engine,
      label: 'engine',
      onError: handleError,
      onConnected: () => {
        ready.engine = true;
        updateConnected();

        engineClient.subscribe(`/topic/game/${sessionId}/tick`, (msg) => {
          setCurrentTick(msg.currentTick);
        });

        engineClient.subscribe(`/topic/game/${sessionId}/state`, (msg) => {
          setCurrentTick(msg.currentTick);
          const departed = departedPlayerIdsRef.current;
          setPlayers((msg.players ?? []).filter(p => !departed.has(p.playerId)));
          setActiveShips((msg.activeShips ?? []).filter(s => !departed.has(s.playerId)));
        });

        engineClient.subscribe(`/topic/game/${sessionId}/player/${myPlayerId}/pilot-request`, (msg) => {
          setPilotRequest(msg);
        });

        engineClient.subscribe(`/topic/game/${sessionId}/minigame-event`, (msg) => {
          if (msg.playerId === myPlayerId) {
            setMinigameEvent(msg);
          }
        });

        engineClient.subscribe(`/topic/game/${sessionId}/political-event`, (msg) => {
          setLastPoliticalEvent(msg);
          const pairs = msg.affectedRoutes ?? [];

          if (msg.type === 'ROUTE_ENFORCED') {
            setBlockedRouteKeys(prev => {
              const next = new Set(prev);
              pairs.forEach(p => next.add(routeKey(p.fromPortId, p.toPortId)));
              return next;
            });
            setAlternativeRouteKeys(prev => {
              const next = new Set(prev);
              pairs.forEach(p => {
                if (p.hasAlternative) next.add(routeKey(p.fromPortId, p.toPortId));
              });
              return next;
            });
          } else if (msg.type === 'ROUTE_UNBLOCKED') {
            setBlockedRouteKeys(prev => {
              const next = new Set(prev);
              pairs.forEach(p => next.delete(routeKey(p.fromPortId, p.toPortId)));
              return next;
            });
            setAlternativeRouteKeys(prev => {
              const next = new Set(prev);
              pairs.forEach(p => next.delete(routeKey(p.fromPortId, p.toPortId)));
              return next;
            });
          } else if (msg.type === 'PILOT_STRIKE_STARTED') {
            const struckPorts = msg.affectedPorts ?? [];
            setPilotStrikePortIds(prev => {
              const next = new Set(prev);
              struckPorts.forEach(p => next.add(p.id));
              return next;
            });
          } else if (msg.type === 'PILOT_STRIKE_ENDED') {
            const struckPorts = msg.affectedPorts ?? [];
            setPilotStrikePortIds(prev => {
              const next = new Set(prev);
              struckPorts.forEach(p => next.delete(p.id));
              return next;
            });
          }

          const newspaperAction = {
            label: 'Read in Newspaper',
            onClick: () => setNewspaperTarget({ headline: msg.headline ?? null, ts: Date.now() }),
          };
          if (msg.type === 'ROUTE_BLOCKED') {
            pushToast({
              type: 'news',
              title: 'Breaking News',
              message: msg.headline ?? 'Route closing soon',
              ttl: 10000,
              actions: [newspaperAction],
            });
          } else if (msg.type === 'ROUTE_ENFORCED') {
            pushToast({
              type: 'news',
              title: 'Global News',
              message: msg.headline ?? 'Route now blocked',
              ttl: 8000,
              actions: [newspaperAction],
            });
          } else if (msg.type === 'ROUTE_UNBLOCKED') {
            pushToast({
              type: 'news',
              title: 'Global News',
              message: msg.headline ?? 'Route reopened',
              ttl: 6000,
              actions: [newspaperAction],
            });
          } else if (msg.type === 'PILOT_STRIKE_STARTED') {
            pushToast({
              type: 'news',
              title: 'Pilot Strike',
              message: msg.headline ?? 'Harbour pilots on strike',
              ttl: 10000,
              actions: [newspaperAction],
            });
          } else if (msg.type === 'PILOT_STRIKE_ENDED') {
            pushToast({
              type: 'news',
              title: 'Pilot Strike Over',
              message: 'Pilot service restored.',
              ttl: 6000,
            });
          }
        });
      },
    });

    sessionClientRef.current = sessionClient;
    cargoClientRef.current = cargoClient;
    engineClientRef.current = engineClient;
    clientRef.current = sessionClient;

    return () => {
      sessionClient.disconnect();
      cargoClient.disconnect();
      engineClient.disconnect();
      sessionClientRef.current = null;
      cargoClientRef.current = null;
      engineClientRef.current = null;
      clientRef.current = null;
      setConnected(false);
    };
  }, [sessionId, myPlayerId]);

  const setSession = useCallback((id, creator = false, playerId = null) => {
    setSessionId(id);
    setMyPlayerId(playerId);
    setCurrentTick(0);
    setPlayers([]);
    setLobbyPlayers([]);
    setGameStarted(false);
    setError(null);
    setIsCreator(creator);
    setEndGameVote(null);
    setGameOver(false);
    setLeaderboard([]);
  }, []);

  const leaveGame = useCallback(async (playerId) => {
    const currentSessionId = sessionId;
    try {
      if (currentSessionId && playerId) {
        await gameService.leaveSession(currentSessionId, playerId);
      }
    } catch (err) {
      console.error('leaveSession API error (ignored, proceeding with cleanup):', err);
    } finally {
      [sessionClientRef, cargoClientRef, engineClientRef].forEach(ref => {
        if (ref.current) {
          ref.current.disconnect();
          ref.current = null;
        }
      });
      clientRef.current = null;
      setSessionId(null);
      setMyPlayerId(null);
      setCurrentTick(0);
      setPlayers([]);
      setLobbyPlayers([]);
      setGameStarted(false);
      setConnected(false);
      setError(null);
      setPilotQueue([]);
      setActiveShips([]);
      setLastReward(null);
      setCustomsInspection(null);
      setCustomsResult(null);
      setSmugglingOffer(null);
      setNewCreatorNotification(null);
      setIsCreator(false);
      setMinigameQueue([]);
      setLastContractFailure(null);
      setBlockedRouteKeys(new Set());
      setAlternativeRouteKeys(new Set());
      setLastPoliticalEvent(null);
      setNewspaperTarget(null);
      setPilotStrikePortIds(new Set());
      departedPlayerIdsRef.current = new Set();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !myPlayerId) return;
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/sessions/${sessionId}/leave?playerId=${myPlayerId}`);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, myPlayerId]);

  const [lastTickTimestamp, setLastTickTimestamp] = useState(Date.now());
  const [tickIntervalMs, setTickIntervalMs] = useState(10000);

  useEffect(() => {
     if (currentTick === 0) return;
     const now = Date.now();
     const elapsed = now - lastTickTimestamp;
     if (elapsed > 1000 && elapsed < 600000) {
         setTickIntervalMs(elapsed);
     }
     setLastTickTimestamp(now);
  }, [currentTick]);

  const value = {
    sessionId,
    myPlayerId,
    setSession,
    currentTick,
    lastTickTimestamp,
    tickIntervalMs,
    players,
    lobbyPlayers,
    lastReward,
    connected,
    error,
    updatePlayerState,
    refreshMyBalance,
    gameStarted,
    pilotRequest,
    setPilotRequest,
    activeShips,
    isCreator,
    setIsCreator,
    endGameVote,
    gameOver,
    leaderboard,
    leaveGame,
    newCreatorNotification,
    setNewCreatorNotification,
    customsInspection,
    setCustomsInspection,
    customsResult,
    setCustomsResult,
    smugglingOffer,
    setSmugglingOffer,
    minigameEvent,
    setMinigameEvent,
    lastContractFailure,
    setLastContractFailure,
    blockedRouteKeys,
    alternativeRouteKeys,
    lastPoliticalEvent,
    newspaperTarget,
    setNewspaperTarget,
    pilotStrikePortIds,
    isRouteBlocked: (fromPortId, toPortId) => blockedRouteKeys.has(routeKey(fromPortId, toPortId)),
    hasAlternativeRoute: (fromPortId, toPortId) => alternativeRouteKeys.has(routeKey(fromPortId, toPortId)),
    isPilotStrikeAtPort: (portId) => pilotStrikePortIds.has(portId),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}