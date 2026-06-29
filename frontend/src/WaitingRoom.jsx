import { useState, useEffect } from "react";
import { createStompClient } from "./websocket/stompClient";

const API_BASE = '/api';

const getSessionWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws-session`;
};

export default function WaitingRoom({ sessionId, sessionCode, myPlayerName, isCreator, onGameStarted }) {
    const [players, setPlayers] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/sessions/${sessionId}/players`)
            .then(res => res.json())
            .then(data => setPlayers(data));
    }, [sessionId]);

    useEffect(() => {
        const client = createStompClient({
            url: getSessionWebSocketUrl(),
            label: 'session-lobby',
            onError: (err) => console.error(err),
            onConnected: () => {
                client.subscribe(`/topic/lobby/${sessionId}/players`, (data) => {
                    if (data.event === "PLAYER_JOINED") {
                        setPlayers(prev => [...prev, { name: data.playerName }]);
                    }
                    if (data.event === "GAME_STARTED") {
                        onGameStarted();
                    }
                });
            },
        });
        return () => client.disconnect();
    }, [sessionId]);

    const copyCode = () => {
        navigator.clipboard.writeText(sessionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <h2>Lobby</h2>
            <p>Session Code: <strong>{sessionCode}</strong>
                <button onClick={copyCode}>{copied ? "Copied!" : "Copy"}</button>
            </p>

            <h3>Players ({players.length})</h3>
            <ul>
                {players.map((p, i) => (
                    <li key={i}>{p.name} {p.name === myPlayerName ? "(You)" : ""}</li>
                ))}
            </ul>

            {isCreator && (
                <button onClick={onGameStarted}>Start game</button>
            )}
            {!isCreator && (
                <p>Wait till the host starts the game...</p>
            )}
        </div>
    );
}
