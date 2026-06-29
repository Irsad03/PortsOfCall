import { Client } from '@stomp/stompjs';

export function createStompClient(options, legacyOnConnected, legacyOnError) {
  const config = typeof options === 'string'
      ? { url: options, onConnected: legacyOnConnected, onError: legacyOnError }
      : options;

  const { url, label = 'stomp', onConnected, onError } = config;

  const client = new Client({
    brokerURL: url,
    reconnectDelay: 5000,

    onConnect: () => {
      console.debug(`[stomp:${label}] connected (${url})`);
      onConnected?.();
    },

    onStompError: (frame) => {
      const msg = `[stomp:${label}] STOMP error: ${frame.headers['message'] ?? 'unknown'}`;
      console.warn(msg);
      onError?.(msg);
    },

    onWebSocketError: () => {
      const msg = `[stomp:${label}] WebSocket connection error (${url})`;
      console.warn(msg);
      onError?.(msg);
    },
  });

  client.activate();

  return {
    subscribe(destination, callback) {
      return client.subscribe(destination, (message) => {
        let body;
        try {
          body = JSON.parse(message.body);
        } catch {
          body = message.body;
        }
        callback(body);
      });
    },

    disconnect() {
      client.deactivate();
    },
  };
}
