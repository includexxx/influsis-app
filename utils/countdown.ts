/**
 * Pure countdown maths for the OTP screen. Everything counts down to an
 * absolute epoch-ms timestamp rather than from a duration, so a backgrounded
 * app lands on the right value when it comes back.
 */

/** Whole seconds from `now` until `at`, never negative. */
export function secondsUntil(at: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((at - now) / 1000));
}

/** `m:ss` for a countdown label, e.g. `4:07`. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * expo-router hands params back as strings (or arrays when repeated). Reads an
 * epoch-ms value out of one; `null` when absent or not a finite number.
 */
export function parseEpochParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
