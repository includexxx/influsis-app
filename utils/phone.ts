/**
 * Phone helpers for the auth forms. Dependency-free: the only country-specific
 * knowledge is the default dial code, which stays a parameter.
 */

/** The country the sign-up phone field is seeded with (`bd` in `dial-codes`). */
export const DEFAULT_DIAL_CODE = '+880';

/** Mirrors the backend's `PHONE_REGEX` - what it treats as a phone. */
export const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/** Digits with optional `+`, spaces, dashes or brackets - a phone, roughly. */
const PHONE_LIKE_REGEX = /^\+?[\d\s().-]{6,}$/;

/**
 * `toE164('+880', '01521-702480')` -> `'+8801521702480'`. Keeps only the digits
 * of the national part and drops its leading zeros (the trunk prefix), since
 * E.164 never carries them.
 */
export function toE164(dialCode: string, national: string): string {
  const code = dialCode.replace(/\D/g, '');
  const digits = national.replace(/\D/g, '').replace(/^0+/, '');
  return `+${code}${digits}`;
}

export function isE164(value: string): boolean {
  return E164_REGEX.test(value);
}

/** True for input that is meant to be a phone number rather than an email. */
export function looksLikePhone(value: string): boolean {
  return !value.includes('@') && PHONE_LIKE_REGEX.test(value.trim());
}

/**
 * The login `identifier` is a phone or an email, and the backend tells them
 * apart by the E.164 shape. A user typing a local number (`017...`) would
 * otherwise be looked up as an email and rejected, so phone-looking input is
 * normalized: `+8801...` kept, `008801...` / `8801...` -> `+8801...`, anything
 * else -> `defaultDialCode` + digits. Emails are trimmed and lowercased.
 */
export function normalizeIdentifier(raw: string, defaultDialCode = DEFAULT_DIAL_CODE): string {
  const value = raw.trim();
  if (!looksLikePhone(value)) return value.toLowerCase();

  const code = defaultDialCode.replace(/\D/g, '');
  let digits = value.replace(/\D/g, '');

  if (value.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith(code) && digits.length > code.length + 7) return `+${digits}`;

  digits = digits.replace(/^0+/, '');
  return `+${code}${digits}`;
}
