import { ApiError } from '@/services';

const GENERIC = 'Something went wrong. Please try again.';
const SESSION_EXPIRED = 'Your sign-in session expired. Go back and sign in again.';

const CODE_MESSAGES: Record<string, string> = {
  AUTH_MFA_INVALID_CODE: 'That code is incorrect.',
  AUTH_TOKEN_INVALID: SESSION_EXPIRED,
  NOT_FOUND: SESSION_EXPIRED,
  AUTH_MFA_REQUIRED: 'Two-factor sign-in is not set up for this account.',
  ACCOUNT_SUSPENDED: 'This account has been suspended.',
  ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
  RATE_LIMITED: 'Too many attempts. Wait a minute and try again.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again.',
};

/** Message for a failed `POST /auth/login/2fa/verify`. */
export function twoFactorVerifyErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;
  return CODE_MESSAGES[err.code] ?? err.message ?? GENERIC;
}
