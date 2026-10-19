import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { AuthTokens, NotificationItem } from '@/types';
import {
  createNotificationsSocket,
  NotificationsSocketDeps,
  RealtimeAuth,
  RealtimeSocket,
  RealtimeSocketOptions,
} from './notificationsSocket';

type Listener = (...args: unknown[]) => unknown;

// Enough of a socket.io-client Socket to drive the manager: `server*` methods
// play the backend's side.
class FakeSocket implements RealtimeSocket {
  connected = false;
  active = false;
  listeners = new Map<string, Listener[]>();
  connect = jest.fn(() => {
    this.active = true;
  });
  disconnect = jest.fn(() => {
    const was = this.connected;
    this.connected = false;
    this.active = false;
    if (was) this.fire('disconnect', 'io client disconnect');
  });
  emit = jest.fn<(event: string, ...args: unknown[]) => void>();

  on(event: string, listener: (...args: never[]) => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener as Listener]);
  }

  fire(event: string, ...args: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }

  serverAccepts() {
    this.connected = true;
    this.active = true;
    this.fire('connect');
  }

  serverRefuses(code: string) {
    this.connected = false;
    this.active = false;
    this.fire('connect_error', Object.assign(new Error(code), { data: { code } }));
  }

  serverCloses() {
    this.connected = false;
    this.active = false;
    this.fire('disconnect', 'io server disconnect');
  }

  networkDrops() {
    // socket.io keeps `active` true and reconnects by itself.
    this.connected = false;
    this.fire('disconnect', 'transport close');
    this.fire('connect_error', new Error('websocket error'));
  }
}

const fresh: AuthTokens = { token: 'access-2', refreshToken: 'refresh-2', tokenExpires: 1 };

function apiError(statusCode: number, code: string) {
  return Object.assign(new Error(code), { statusCode, code });
}

let socket: FakeSocket;
let options: RealtimeSocketOptions | undefined;
let deps: { [K in keyof NotificationsSocketDeps]: NotificationsSocketDeps[K] } & {
  refreshSession: jest.Mock<() => Promise<AuthTokens>>;
  onNew: jest.Mock;
  onUnreadCount: jest.Mock;
  onRead: jest.Mock;
  onResync: jest.Mock;
  onConnectionChange: jest.Mock;
  onSignOut: jest.Mock;
};

async function flush() {
  await jest.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  jest.useFakeTimers();
  socket = new FakeSocket();
  options = undefined;
  deps = {
    io: jest.fn((_url: string, opts: RealtimeSocketOptions) => {
      options = opts;
      return socket;
    }),
    url: 'http://api.test/realtime',
    getToken: () => 'access-1',
    lang: 'en',
    refreshSession: jest.fn<() => Promise<AuthTokens>>().mockResolvedValue(fresh),
    random: () => 0.5, // jitter x1.0: exact backoff delays
    onNew: jest.fn(),
    onUnreadCount: jest.fn(),
    onRead: jest.fn(),
    onResync: jest.fn(),
    onConnectionChange: jest.fn(),
    onSignOut: jest.fn(),
  };
});

afterEach(() => {
  jest.useRealTimers();
});

function started() {
  const manager = createNotificationsSocket(deps);
  manager.start();
  return manager;
}

describe('createNotificationsSocket', () => {
  test('creates one websocket-only socket with the current token and language', () => {
    const manager = started();
    manager.start();

    expect(deps.io).toHaveBeenCalledTimes(1);
    expect(deps.io).toHaveBeenCalledWith('http://api.test/realtime', expect.anything());
    expect(options).toEqual(
      expect.objectContaining({
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 30_000,
        randomizationFactor: 0.5,
      }),
    );
    let auth: RealtimeAuth | undefined;
    options?.auth(a => (auth = a));
    expect(auth).toEqual({ token: 'access-1', lang: 'en' });
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  test('connect reports the connection and resyncs', () => {
    started();
    socket.serverAccepts();

    expect(deps.onConnectionChange).toHaveBeenLastCalledWith(true);
    expect(deps.onResync).toHaveBeenCalledTimes(1);
  });

  test('forwards every notification event', () => {
    started();
    socket.serverAccepts();
    const item = { id: 'n-1' } as NotificationItem;

    socket.fire('notification:new', item);
    socket.fire('notification:unread_count', { count: 4 });
    socket.fire('notification:read', { all: true, before: '2026-10-17T09:00:00.000Z' });
    socket.fire('realtime:resync', {});

    expect(deps.onNew).toHaveBeenCalledWith(item);
    expect(deps.onUnreadCount).toHaveBeenCalledWith(4);
    expect(deps.onRead).toHaveBeenCalledWith({ all: true, before: '2026-10-17T09:00:00.000Z' });
    expect(deps.onResync).toHaveBeenCalledTimes(2);
  });

  describe('auth:expiring', () => {
    test('refreshes once through the shared refresh and sends auth:refresh with the new token', async () => {
      started();
      socket.serverAccepts();

      socket.fire('auth:expiring', { expiresAt: '2026-10-17T09:15:00.000Z' });
      await flush();

      expect(deps.refreshSession).toHaveBeenCalledTimes(1);
      expect(socket.emit).toHaveBeenCalledWith(
        'auth:refresh',
        { token: 'access-2' },
        expect.any(Function),
      );
    });

    test('an ok ack keeps the socket as it is', async () => {
      started();
      socket.serverAccepts();
      socket.fire('auth:expiring', {});
      await flush();

      const ack = socket.emit.mock.calls[0][2] as (a: unknown) => void;
      ack({ ok: true });

      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    test('a not-ok ack reconnects without signing out', async () => {
      started();
      socket.serverAccepts();
      socket.fire('auth:expiring', {});
      await flush();

      const ack = socket.emit.mock.calls[0][2] as (a: unknown) => void;
      ack({ ok: false, code: 'AUTH_TOKEN_INVALID' });

      expect(socket.disconnect).toHaveBeenCalledTimes(1);
      expect(socket.connect).toHaveBeenCalledTimes(2);
      expect(deps.onSignOut).not.toHaveBeenCalled();
    });

    test('a failed refresh sends nothing and leaves it to the server close', async () => {
      deps.refreshSession.mockRejectedValue(apiError(0, 'NETWORK_ERROR'));
      started();
      socket.serverAccepts();

      socket.fire('auth:expiring', {});
      await flush();

      expect(socket.emit).not.toHaveBeenCalled();
      expect(deps.onSignOut).not.toHaveBeenCalled();
    });
  });

  describe('connect_error (handshake refused)', () => {
    test.each([
      'AUTH_SESSION_REVOKED',
      'ACCOUNT_SUSPENDED',
      'ACCOUNT_DEACTIVATED',
      'ACCOUNT_PENDING_VERIFICATION',
    ])('%s signs out and never retries', async code => {
      started();
      socket.serverRefuses(code);
      await jest.advanceTimersByTimeAsync(60_000);

      expect(deps.onSignOut).toHaveBeenCalledTimes(1);
      expect(socket.connect).toHaveBeenCalledTimes(1);
    });

    test.each(['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_EXPIRED'])(
      '%s refreshes, then reconnects after the backoff',
      async code => {
        started();
        socket.serverRefuses(code);
        await flush();

        expect(deps.refreshSession).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(999);
        expect(socket.connect).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(socket.connect).toHaveBeenCalledTimes(2);
      },
    );

    test('a token code whose refresh is dead signs out', async () => {
      deps.refreshSession.mockRejectedValue(apiError(401, 'AUTH_SESSION_REVOKED'));
      started();
      socket.serverRefuses('AUTH_TOKEN_EXPIRED');
      await flush();

      expect(deps.onSignOut).toHaveBeenCalledTimes(1);
    });

    test('INTERNAL_ERROR retries with a doubling backoff and no refresh, then resets on connect', async () => {
      started();
      socket.serverRefuses('INTERNAL_ERROR');
      await jest.advanceTimersByTimeAsync(1_000);
      expect(socket.connect).toHaveBeenCalledTimes(2);

      socket.serverRefuses('INTERNAL_ERROR');
      await jest.advanceTimersByTimeAsync(1_999);
      expect(socket.connect).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(socket.connect).toHaveBeenCalledTimes(3);

      socket.serverAccepts();
      socket.serverCloses();
      deps.refreshSession.mockRejectedValue(apiError(0, 'NETWORK_ERROR'));
      await flush();
      await jest.advanceTimersByTimeAsync(1_000);
      expect(socket.connect).toHaveBeenCalledTimes(4);
      expect(deps.refreshSession).toHaveBeenCalledTimes(1);
    });

    test('a transport failure is left to the built-in reconnection', async () => {
      started();
      socket.serverAccepts();
      socket.networkDrops();
      await jest.advanceTimersByTimeAsync(60_000);

      expect(socket.connect).toHaveBeenCalledTimes(1);
      expect(deps.refreshSession).not.toHaveBeenCalled();
      expect(deps.onConnectionChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe('io server disconnect', () => {
    test('refreshes and reconnects at once', async () => {
      started();
      socket.serverAccepts();
      socket.serverCloses();
      await flush();

      expect(deps.onConnectionChange).toHaveBeenLastCalledWith(false);
      expect(deps.refreshSession).toHaveBeenCalledTimes(1);
      expect(socket.connect).toHaveBeenCalledTimes(2);
    });

    test('a dead session signs out', async () => {
      deps.refreshSession.mockRejectedValue(apiError(401, 'AUTH_SESSION_REVOKED'));
      started();
      socket.serverAccepts();
      socket.serverCloses();
      await flush();

      expect(deps.onSignOut).toHaveBeenCalledTimes(1);
      expect(socket.connect).toHaveBeenCalledTimes(1);
    });

    test('a network failure retries with backoff', async () => {
      deps.refreshSession.mockRejectedValue(apiError(0, 'NETWORK_ERROR'));
      started();
      socket.serverAccepts();
      socket.serverCloses();
      await flush();
      expect(socket.connect).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1_000);
      expect(socket.connect).toHaveBeenCalledTimes(2);
    });
  });

  test('our own stop() is not treated as a server close', async () => {
    const manager = started();
    socket.serverAccepts();

    manager.stop();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(deps.refreshSession).not.toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(deps.onConnectionChange).toHaveBeenLastCalledWith(false);
  });

  test('stop() cancels a pending retry', async () => {
    const manager = started();
    socket.serverRefuses('INTERNAL_ERROR');

    manager.stop();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  test('start() after stop() reuses the same socket', () => {
    const manager = started();
    socket.serverAccepts();
    manager.stop();

    manager.start();

    expect(deps.io).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(2);
  });
});
