/**
 * Single-use in-memory holder for the `preAuthToken` from the `mfaRequired`
 * login branch. Opaque, 5-minute server lifetime. Kept off navigation params
 * so it never reaches the web URL, a log, Redux, or storage. Lost on a cold
 * restart, which is fine - the token expires anyway and the user re-signs-in.
 */
let pending: string | null = null;

export function setPendingPreAuthToken(token: string): void {
  pending = token;
}

/** Peek only - does not clear (React strict mode double-invokes initializers). */
export function getPendingPreAuthToken(): string | null {
  return pending;
}

export function clearPendingPreAuthToken(): void {
  pending = null;
}
