import { ApiError } from '@/services';

const GENERIC = 'Something went wrong. Please try again.';
const NETWORK = 'Cannot reach the server. Check your connection and try again.';

/**
 * Message for a `handle` conflict on onboarding/PATCH — `null` for anything
 * else. Callers use the `null`/non-`null` split to decide whether an error
 * routes onto the handle field specifically or the form-level message.
 */
export function handleConflictMessage(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code === 'HANDLE_TAKEN') return 'That username was just claimed. Pick another.';
  if (err.code === 'HANDLE_RESERVED') return 'That username is reserved. Pick another.';
  return null;
}

/** Message for a failed `POST /profiles/onboarding-creator` or `PATCH /profiles/me`. */
export function profileSubmitErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;

  const handleMessage = handleConflictMessage(err);
  if (handleMessage) return handleMessage;

  if (err.code === 'VALIDATION_FAILED') {
    const firstMessage = err.errors ? Object.values(err.errors)[0] : undefined;
    return firstMessage || 'Some details need fixing.';
  }
  if (err.code === 'MEDIA_INVALID_TYPE') {
    return "That image format isn't supported. Use JPEG, PNG, GIF or WebP.";
  }
  if (err.code === 'MEDIA_TOO_LARGE') return 'That image is too large. Pick a smaller one.';
  if (err.code === 'NOT_FOUND') return "We couldn't find your profile.";
  if (err.code === 'INSUFFICIENT_ROLE' || err.code === 'FORBIDDEN') {
    return "Your account can't edit a creator profile.";
  }
  if (err.code === 'NETWORK_ERROR') return NETWORK;

  return err.message || GENERIC;
}
