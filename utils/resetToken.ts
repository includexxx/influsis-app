/**
 * Single-use in-memory holder for the `resetToken` from
 * `POST /auth/otp/verify` (`purpose: password_reset`). Kept off navigation
 * params so it never reaches the web URL, a log, Redux, or storage. Lost on a
 * cold restart, which is correct - the user restarts the reset flow.
 */
let pending: string | null = null;

export function setPendingResetToken(token: string): void {
  pending = token;
}

/** Peek only - does not clear (React strict mode double-invokes initializers). */
export function getPendingResetToken(): string | null {
  return pending;
}

export function clearPendingResetToken(): void {
  pending = null;
}
