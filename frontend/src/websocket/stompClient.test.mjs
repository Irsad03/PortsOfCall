import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let fakeClientInstance;
let capturedConfig;

class FakeClient {
  constructor(config) {
    capturedConfig = config;
    this.activateCalled = false;
    this.deactivateCalled = false;
    this.subscriptions = {};
    fakeClientInstance = this;
  }
  activate()    { this.activateCalled = true; }
  deactivate()  { this.deactivateCalled = true; }
  subscribe(destination, callback) {
    this.subscriptions[destination] = callback;
  }
  simulateMessage(destination, body) {
    const handler = this.subscriptions[destination];
    assert.ok(handler, `No subscriber for ${destination}`);
    handler({ body: typeof body === 'string' ? body : JSON.stringify(body) });
  }
}

mock.module('@stomp/stompjs', { namedExports: { Client: FakeClient } });

const { createStompClient } = await import('./stompClient.js');

describe('createStompClient', () => {

  beforeEach(() => {
    fakeClientInstance = null;
    capturedConfig = null;
  });

  test('activate() wird beim Erstellen aufgerufen', () => {
    createStompClient('ws://localhost/ws', () => {}, () => {});
    assert.ok(fakeClientInstance.activateCalled, 'activate sollte aufgerufen worden sein');
  });

  test('onConnected Callback wird bei STOMP-Verbindung aufgerufen', () => {
    let connected = false;
    createStompClient('ws://localhost/ws', () => { connected = true; }, () => {});
    capturedConfig.onConnect();
    assert.ok(connected, 'onConnected sollte nach onConnect aufgerufen sein');
  });

  test('subscribe() leitet an den STOMP-Client weiter', () => {
    const client = createStompClient('ws://localhost/ws', () => {}, () => {});
    capturedConfig.onConnect();
    client.subscribe('/topic/game/abc/tick', () => {});
    assert.ok(
      fakeClientInstance.subscriptions['/topic/game/abc/tick'],
      'Subscription sollte registriert sein'
    );
  });

  test('eingehende JSON-Nachricht wird geparst und an callback übergeben', () => {
    let received = null;
    const client = createStompClient('ws://localhost/ws', () => {}, () => {});
    capturedConfig.onConnect();
    client.subscribe('/topic/game/abc/tick', (msg) => { received = msg; });
    fakeClientInstance.simulateMessage('/topic/game/abc/tick', { sessionId: 'abc', currentTick: 7 });
    assert.deepEqual(received, { sessionId: 'abc', currentTick: 7 });
  });

  test('nicht-JSON Body wird als String durchgereicht', () => {
    let received = null;
    const client = createStompClient('ws://localhost/ws', () => {}, () => {});
    capturedConfig.onConnect();
    client.subscribe('/topic/test', (msg) => { received = msg; });
    fakeClientInstance.simulateMessage('/topic/test', 'plain text');
    assert.equal(received, 'plain text');
  });

  test('STOMP-Fehler ruft onError Callback auf', () => {
    let errMsg = null;
    createStompClient('ws://localhost/ws', () => {}, (e) => { errMsg = e; });
    capturedConfig.onStompError({ headers: { message: 'broker unavailable' } });
    assert.ok(errMsg?.includes('broker unavailable'));
  });

  test('WebSocket-Fehler ruft onError Callback auf', () => {
    let errMsg = null;
    createStompClient('ws://localhost/ws', () => {}, (e) => { errMsg = e; });
    capturedConfig.onWebSocketError();
    assert.ok(errMsg?.includes('WebSocket'));
  });

  test('disconnect() ruft deactivate() auf dem STOMP-Client auf', () => {
    const client = createStompClient('ws://localhost/ws', () => {}, () => {});
    client.disconnect();
    assert.ok(fakeClientInstance.deactivateCalled, 'deactivate sollte aufgerufen worden sein');
  });

  test('reconnectDelay ist auf 5000ms gesetzt', () => {
    createStompClient('ws://localhost/ws', () => {}, () => {});
    assert.equal(capturedConfig.reconnectDelay, 5000);
  });

  test('brokerURL wird korrekt weitergegeben', () => {
    createStompClient('ws://my-server:9090/ws', () => {}, () => {});
    assert.equal(capturedConfig.brokerURL, 'ws://my-server:9090/ws');
  });
});
