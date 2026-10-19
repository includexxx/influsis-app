// Pure decision tables for the realtime socket (backend
// CLIENT_INTEGRATION §6, build-plan 38b). services/realtime/notificationsSocket.ts
// applies them; keeping them here makes every row testable on its own.

export type ConnectErrorAction = 'refresh-then-retry' | 'sign-out' | 'retry';
export type ServerDisconnectAction = 'reconnect' | 'sign-out' | 'retry';

const REFRESH_CODES = new Set(['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_EXPIRED']);

/** Codes that end the session: the session or the account is gone. */
export const SIGN_OUT_CODES = new Set([
  'AUTH_SESSION_REVOKED',
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_DEACTIVATED',
  'ACCOUNT_PENDING_VERIFICATION',
]);

/** What to do when the server refuses the handshake with `code`. */
export function connectErrorAction(code: string | undefined): ConnectErrorAction {
  if (code && REFRESH_CODES.has(code)) return 'refresh-then-retry';
  if (code && SIGN_OUT_CODES.has(code)) return 'sign-out';
  // INTERNAL_ERROR and anything unknown.
  return 'retry';
}

export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

/**
 * Retry delay for the n-th consecutive failure (0-based): 1 s doubling to
 * 30 s, jittered by x0.5-1.5 so devices don't retry in step, still capped.
 */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF_BASE_MS * 2 ** Math.max(0, attempt), BACKOFF_MAX_MS);
  return Math.min(Math.round(base * (0.5 + random())), BACKOFF_MAX_MS);
}

/** How the refresh run after a server-side close went. */
export type RefreshOutcome = { ok: true } | { ok: false; statusCode?: number; code?: string };

/**
 * After `io server disconnect` (token expiry, revoked session, suspension):
 * a working refresh reconnects; a dead session or account signs out; a
 * network-ish failure retries with backoff.
 */
export function serverDisconnectAction(outcome: RefreshOutcome): ServerDisconnectAction {
  if (outcome.ok) return 'reconnect';
  if (outcome.statusCode === 401 || outcome.statusCode === 403) return 'sign-out';
  if (outcome.code && SIGN_OUT_CODES.has(outcome.code)) return 'sign-out';
  return 'retry';
}
