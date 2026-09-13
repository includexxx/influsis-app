import { ApiError } from '@/services';

const GENERIC = 'Something went wrong. Please try again.';
const NETWORK = 'Cannot reach the server. Check your connection and try again.';

/** Message for a failed `POST /auth/otp/verify`. */
export function otpVerifyErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;

  if (err.code === 'VALIDATION_FAILED') {
    if (err.errors?.code === 'incorrect') return 'The code you entered is incorrect.';
    if (err.errors?.code === 'invalidOrExpired') return 'That code has expired. Request a new one.';
  }
  if (err.code === 'NOT_FOUND') return 'We could not find an account for that email.';
  if (err.code === 'RATE_LIMITED') return 'Too many attempts. Wait a minute and try again.';
  if (err.code === 'NETWORK_ERROR') return NETWORK;

  return err.message || GENERIC;
}

/** Message for a failed `POST /auth/otp/request` (the "Resend Code" action). */
export function otpRequestErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;
  if (err.code === 'RATE_LIMITED') return 'You are requesting codes too fast. Wait a minute.';
  if (err.code === 'NETWORK_ERROR') return NETWORK;
  return err.message || GENERIC;
}
