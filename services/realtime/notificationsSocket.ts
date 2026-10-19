import { AuthTokens, NotificationItem } from '@/types';
import { backoffDelay, connectErrorAction, RefreshOutcome, serverDisconnectAction } from './policy';

// The one realtime socket (backend /realtime, 24d; build-plan 38b). Plain
// TypeScript with every dependency injected - no React, no Redux - so the
// connection rules can be tested against a fake socket.
// hooks/useRealtimeNotifications.ts is the only glue to the app.
//
// Two kinds of failure need different handling in socket.io v4:
// - A transport failure (network drop) leaves `socket.active` true and the
//   built-in reconnection retries with the same 1-30 s jittered backoff.
// - A refused handshake (`connect_error` from the server's auth middleware)
//   or a server-side close (`io server disconnect`) leaves it false, and
//   socket.io does NOT retry; this module does, per services/realtime/policy.ts.

/** The part of a socket.io-client Socket this module uses. */
export interface RealtimeSocket {
  readonly connected: boolean;
  readonly active: boolean;
  on(event: string, listener: (...args: never[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
  connect(): unknown;
  disconnect(): unknown;
}

export type RealtimeAuth = { token: string | null; lang: string };

export interface RealtimeSocketOptions {
  transports: string[];
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  randomizationFactor: number;
  /** A function, so every (re)connect sends the current access token. */
  auth: (cb: (auth: RealtimeAuth) => void) => void;
}

export type IoFactory = (url: string, options: RealtimeSocketOptions) => RealtimeSocket;

export interface ReadEvent {
  ids?: string[];
  all?: boolean;
  before?: string;
}

type RefreshAck = { ok: true } | { ok: false; code?: string };

export interface NotificationsSocketDeps {
  io: IoFactory;
  url: string;
  getToken: () => string | null;
  lang: string;
  /** The shared single-flight refresh (services/http.ts). Never a second one. */
  refreshSession: () => Promise<AuthTokens>;
  random?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  onNew: (item: NotificationItem) => void;
  onUnreadCount: (count: number) => void;
  onRead: (event: ReadEvent) => void;
  /** Refetch NT2 (and page 1 if the feed is open): after every connect and on `realtime:resync`. */
  onResync: () => void;
  onConnectionChange: (connected: boolean) => void;
  onSignOut: () => void;
}

export interface NotificationsSocket {
  /** Connect (once) and keep connected until stop(). */
  start(): void;
  /** Disconnect and cancel any pending retry. */
  stop(): void;
}

function errorCode(err: unknown): string | undefined {
  const e = err as { data?: { code?: unknown }; message?: unknown } | undefined;
  if (typeof e?.data?.code === 'string') return e.data.code;
  return typeof e?.message === 'string' ? e.message : undefined;
}

export function createNotificationsSocket(deps: NotificationsSocketDeps): NotificationsSocket {
  const random = deps.random ?? Math.random;
  const schedule = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = deps.clearTimeout ?? (handle => clearTimeout(handle as never));

  let socket: RealtimeSocket | null = null;
  let wanted = false;
  let attempt = 0;
  let retryTimer: unknown = null;

  function clearRetry() {
    if (retryTimer !== null) cancel(retryTimer);
    retryTimer = null;
  }

  function scheduleRetry() {
    clearRetry();
    const delay = backoffDelay(attempt++, random);
    retryTimer = schedule(() => {
      retryTimer = null;
      if (wanted) ensureSocket().connect();
    }, delay);
  }

  function signOut() {
    wanted = false;
    clearRetry();
    socket?.disconnect();
    deps.onSignOut();
  }

  async function refresh(): Promise<RefreshOutcome> {
    try {
      await deps.refreshSession();
      return { ok: true };
    } catch (err) {
      const e = err as { statusCode?: number; code?: string } | undefined;
      return { ok: false, statusCode: e?.statusCode, code: e?.code };
    }
  }

  /** After a failed refresh: sign out on a dead session, else back off. */
  function onRefreshFailed(outcome: RefreshOutcome) {
    if (serverDisconnectAction(outcome) === 'sign-out') signOut();
    else scheduleRetry();
  }

  function wire(s: RealtimeSocket) {
    s.on('connect', () => {
      attempt = 0;
      clearRetry();
      deps.onConnectionChange(true);
      deps.onResync();
    });

    s.on('notification:new', (item: NotificationItem) => deps.onNew(item));
    s.on('notification:unread_count', (payload: { count: number }) =>
      deps.onUnreadCount(payload.count),
    );
    s.on('notification:read', (payload: ReadEvent) => deps.onRead(payload));
    s.on('realtime:resync', () => deps.onResync());

    s.on('auth:expiring', async () => {
      let tokens: AuthTokens;
      try {
        tokens = await deps.refreshSession();
      } catch {
        // The server closes the socket at exp + 30 s; the
        // `io server disconnect` path below takes over.
        return;
      }
      if (!wanted || !s.connected) return;
      s.emit('auth:refresh', { token: tokens.token }, (ack: RefreshAck | undefined) => {
        if (ack?.ok || !wanted) return;
        // Not a sign-out: reconnect, and the auth callback sends the new token.
        s.disconnect();
        s.connect();
      });
    });

    s.on('connect_error', async (err: Error) => {
      // Still active: a transport failure the built-in reconnection retries.
      if (s.active || !wanted) return;
      switch (connectErrorAction(errorCode(err))) {
        case 'sign-out':
          signOut();
          return;
        case 'retry':
          scheduleRetry();
          return;
        case 'refresh-then-retry': {
          const outcome = await refresh();
          if (!wanted) return;
          if (outcome.ok) scheduleRetry();
          else onRefreshFailed(outcome);
        }
      }
    });

    s.on('disconnect', async (reason: string) => {
      deps.onConnectionChange(false);
      // Only the backend closing the socket (token expiry, revoked session,
      // suspension); never our own stop() (`io client disconnect`).
      if (reason !== 'io server disconnect' || !wanted) return;
      const outcome = await refresh();
      if (!wanted) return;
      if (outcome.ok) ensureSocket().connect();
      else onRefreshFailed(outcome);
    });
  }

  function ensureSocket(): RealtimeSocket {
    if (!socket) {
      socket = deps.io(deps.url, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 30_000,
        randomizationFactor: 0.5,
        auth: cb => cb({ token: deps.getToken(), lang: deps.lang }),
      });
      wire(socket);
    }
    return socket;
  }

  return {
    start() {
      wanted = true;
      clearRetry();
      const s = ensureSocket();
      if (s.connected || s.active) return;
      s.connect();
    },
    stop() {
      wanted = false;
      clearRetry();
      attempt = 0;
      socket?.disconnect();
      deps.onConnectionChange(false);
    },
  };
}
