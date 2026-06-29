const API_BASE = '/api';

let globalErrorHandler = null;
export function registerErrorHandler(fn) { globalErrorHandler = fn; }

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message ?? body.detail ?? `HTTP ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.path = body.path;
        if (globalErrorHandler) {
            globalErrorHandler({ status: res.status, message, path: body.path });
        }
        throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

async function withRetry(fn, maxRetries = 3, delayMs = 100) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isLockConflict = err.status === 409;
            if (!isLockConflict || attempt === maxRetries) throw err;
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }
}

async function createPlayerRaw(name, sessionId = null) {
    const res = await fetch(`${API_BASE}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sessionId }),
    });
    return handleResponse(res);
}

async function updatePlayerSession(playerId, sessionId) {
    const res = await fetch(`${API_BASE}/players/${playerId}/session`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
    });
    return handleResponse(res);
}

export const gameService = {

    createSession: async (playerName) => {
        const player = await createPlayerRaw(playerName);

        const sessionRes = await fetch(`${API_BASE}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creatorPlayerId: player.id, creatorName: playerName }),
        });
        const session = await handleResponse(sessionRes);

        await updatePlayerSession(player.id, session.id);

        return { ...session, playerId: player.id, playerName };
    },

    joinSession: async (sessionCode, playerName) => {
        return withRetry(async () => {
            const player = await createPlayerRaw(playerName);

            const joinRes = await fetch(`${API_BASE}/sessions/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionCode,
                    playerId: player.id,
                    playerName,
                }),
            });
            const session = await handleResponse(joinRes);

            await updatePlayerSession(player.id, session.id);

            return { ...session, playerId: player.id, playerName };
        });
    },

    startSession: async (sessionId, playerId) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/start?playerId=${encodeURIComponent(playerId)}`, { method: 'POST' });
        return handleResponse(res);
    },

    getSessionPlayers: async (sessionId) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/players`);
        return handleResponse(res);
    },

    getNews: async (sessionId, { category, sinceTick, limit = 25, offset = 0 } = {}) => {
        const params = new URLSearchParams();
        if (category && category.length > 0) {
            params.set('category', Array.isArray(category) ? category.join(',') : category);
        }
        if (sinceTick != null) params.set('sinceTick', sinceTick);
        params.set('limit', limit);
        params.set('offset', offset);
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/news?${params.toString()}`);
        return handleResponse(res);
    },

    startEndGameVote: async (sessionId, playerId) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/start-end-game-vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId }),
        });
        return handleResponse(res);
    },

    voteEndGame: async (sessionId, playerId, vote) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/vote-end-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, vote }),
        });
        return handleResponse(res);
    },

    leaveSession: async (sessionId, playerId) => {
        return withRetry(async () => {
            const res = await fetch(
                `${API_BASE}/sessions/${sessionId}/leave?playerId=${encodeURIComponent(playerId)}`,
                { method: 'POST' }
            );
            return handleResponse(res);
        });
    },

    getPorts: async () => {
        const res = await fetch(`${API_BASE}/ports`);
        return handleResponse(res);
    },

    findRoute: async (fromPortId, toPortId) => {
        const res = await fetch(
            `${API_BASE}/routes/find?from=${encodeURIComponent(fromPortId)}&to=${encodeURIComponent(toPortId)}`
        );
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    },

    setHomePort: async (playerId, portId) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/home-port`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portId }),
        });
        return handleResponse(res);
    },

    getMarketShips: async () => {
        const res = await fetch(`${API_BASE}/ships/market`);
        return handleResponse(res);
    },

    buyShip: async (playerId, shipId, shipName) => {
        const res = await fetch(`${API_BASE}/ships/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId, shipName }),
        });
        return handleResponse(res);
    },

    sellShip: async (playerId, shipId) => {
        const res = await fetch(`${API_BASE}/ships/${encodeURIComponent(shipId)}/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId }),
        });
        return handleResponse(res);
    },

    getShipsAtPort: async (portId, playerId) => {
        const res = await fetch(`${API_BASE}/ships/at-port?portId=${portId}&playerId=${playerId}`);
        return handleResponse(res);
    },

    getFleet: async (playerId) => {
        const res = await fetch(`${API_BASE}/ships/fleet/${playerId}`);
        return handleResponse(res);
    },

    refuelShip: async (playerId, shipId) => {
        const res = await fetch(`${API_BASE}/ships/refuel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId }),
        });
        return handleResponse(res);
    },

    repairShip: async (playerId, shipId) => {
        const res = await fetch(`${API_BASE}/ships/repair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId }),
        });
        return handleResponse(res);
    },

    hirePilot: async (playerId, shipId) => {
        const res = await fetch(`${API_BASE}/ships/hire-pilot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId }),
        });
        return handleResponse(res);
    },

    navigateSelf: async (playerId, shipId) => {
        const res = await fetch(`${API_BASE}/ships/navigate-self`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId }),
        });
        return handleResponse(res);
    },

    submitParkingResult: async (playerId, shipId, success, score) => {
        const res = await fetch(`${API_BASE}/ships/parking-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId, success, score }),
        });
        return handleResponse(res);
    },

    startRoute: async (routeData) => {
        const res = await fetch(`${API_BASE}/ships/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(routeData),
        });
        return handleResponse(res);
    },

    acceptSmuggling: async (shipId, playerId) => {
        const res = await fetch(
            `${API_BASE}/ships/${shipId}/smuggling/accept?playerId=${encodeURIComponent(playerId)}`,
            { method: 'POST' }
        );
        return handleResponse(res);
    },

    rejectSmuggling: async (shipId, playerId) => {
        const res = await fetch(
            `${API_BASE}/ships/${shipId}/smuggling/reject?playerId=${encodeURIComponent(playerId)}`,
            { method: 'POST' }
        );
        return handleResponse(res);
    },

    startMinigame: async (sessionId, shipId) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/minigame/start?shipId=${encodeURIComponent(shipId)}`, {
            method: 'POST',
        });
        return handleResponse(res);
    },

    finishMinigame: async (sessionId, shipId) => {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/minigame/finish?shipId=${encodeURIComponent(shipId)}`, {
            method: 'POST',
        });
        return handleResponse(res);
    },

    finishRatsMinigame: async (shipId, success) => {
        const res = await fetch(`${API_BASE}/ships/${shipId}/minigame/rats/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success }),
        });
        return handleResponse(res);
    },

    finishOverboardMinigame: async (shipId, success, rescueTimeMs) => {
        const res = await fetch(`${API_BASE}/ships/${encodeURIComponent(shipId)}/minigame/overboard/finish`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ success: !!success, rescueTimeMs: rescueTimeMs ?? 0 }),
        });
        return handleResponse(res);
    },

    getCargo: async (portId, sessionId, currentTick = 0) => {
        const res = await fetch(
            `${API_BASE}/cargo/market?portId=${portId}&sessionId=${sessionId}&currentTick=${currentTick}`
        );
        return handleResponse(res);
    },

    getAllCargo: async (sessionId, currentTick = 0) => {
        const res = await fetch(
            `${API_BASE}/cargo/all?sessionId=${sessionId}&currentTick=${currentTick}`
        );
        return handleResponse(res);
    },

    acceptCargo: async (playerId, contractId, shipId) => {
        const res = await fetch(`${API_BASE}/cargo/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, contractId, shipId }),
        });
        return handleResponse(res);
    },

    unloadCargo: async (playerId, shipId, currentTick) => {
        const res = await fetch(`${API_BASE}/cargo/unload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId, currentTick }),
        });
        return handleResponse(res);
    },

    forfeitContract: async (playerId, shipId, contractId) => {
        const res = await fetch(`${API_BASE}/cargo/forfeit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, shipId, contractId }),
        });
        return handleResponse(res);
    },

    getPlayer: async (playerId) => {
        const res = await fetch(`${API_BASE}/players/${playerId}`);
        return handleResponse(res);
    },

    getContractsForShip: async (shipId, status) => {
        const res = await fetch(
            `${API_BASE}/cargo/ship/${shipId}?status=${encodeURIComponent(status)}`,
        );
        return handleResponse(res);
    },

    getBankOverview: async (playerId) => {
        const res = await fetch(`${API_BASE}/bank/${playerId}/overview`);
        return handleResponse(res);
    },

    getLoanQuote: async (playerId, amount, termTicks) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/loans/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, termTicks }),
        });
        return handleResponse(res);
    },

    takeLoan: async (playerId, amount, termTicks, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/loans?currentTick=${currentTick}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, termTicks }),
        });
        const data = await handleResponse(res);
        return data?.loan ?? data;
    },

    getLoans: async (playerId, status) => {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        const res = await fetch(`${API_BASE}/players/${playerId}/loans${query}`);
        return handleResponse(res);
    },

    getLoanHistory: async (loanId) => {
        const res = await fetch(`${API_BASE}/loans/${loanId}/history`);
        return handleResponse(res);
    },

    payLoanInstallment: async (loanId, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/loans/${loanId}/pay?currentTick=${currentTick}`, { method: 'POST' });
        return handleResponse(res);
    },

    payOffLoan: async (loanId, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/loans/${loanId}/payoff?currentTick=${currentTick}`, { method: 'POST' });
        return handleResponse(res);
    },

    getMortgageOptions: async (playerId) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/mortgage-options`);
        return handleResponse(res);
    },

    getMortgageQuote: async (playerId, shipId, amount, termTicks) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/mortgages/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipId, amount, termTicks }),
        });
        return handleResponse(res);
    },

    takeMortgage: async (playerId, shipId, amount, termTicks, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/players/${playerId}/mortgages?currentTick=${currentTick}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipId, amount, termTicks }),
        });
        const data = await handleResponse(res);
        return data?.mortgage ?? data;
    },

    getMortgages: async (playerId, status) => {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        const res = await fetch(`${API_BASE}/players/${playerId}/mortgages${query}`);
        return handleResponse(res);
    },

    getMortgageHistory: async (mortgageId) => {
        const res = await fetch(`${API_BASE}/mortgages/${mortgageId}/history`);
        return handleResponse(res);
    },

    payMortgageInstallment: async (mortgageId, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/mortgages/${mortgageId}/pay?currentTick=${currentTick}`, { method: 'POST' });
        return handleResponse(res);
    },

    payOffMortgage: async (mortgageId, currentTick = 0) => {
        const res = await fetch(`${API_BASE}/mortgages/${mortgageId}/payoff?currentTick=${currentTick}`, { method: 'POST' });
        return handleResponse(res);
    },
};
