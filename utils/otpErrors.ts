import { ApiError } from '@/services';

const GENERIC = 'Something went wrong. Please try again.';
const NETWORK = 'Cannot reach the server. Check your connection and try again.';
// `503 SERVICE_UNAVAILABLE`: the SMS gateway refused or could not route the
// number (it only serves Bangladeshi mobiles).
const SMS_UNAVAILABLE =
  'We could not send the SMS. Codes can only be sent to Bangladeshi mobile numbers right now. Try again in a moment.';

/** Message for a failed `POST /auth/otp/verify`. */
export function otpVerifyErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;

  if (err.code === 'VALIDATION_FAILED') {
    if (err.errors?.code === 'incorrect') return 'The code you entered is incorrect.';
    if (err.errors?.code === 'invalidOrExpired') return 'That code has expired. Request a new one.';
  }
  if (err.code === 'NOT_FOUND')
    return 'We could not find an account for that email or phone number.';
  if (err.code === 'RATE_LIMITED') return 'Too many attempts. Wait a minute and try again.';
  if (err.code === 'SERVICE_UNAVAILABLE') return SMS_UNAVAILABLE;
  if (err.code === 'NETWORK_ERROR') return NETWORK;

  return err.message || GENERIC;
}

/** Message for a failed `POST /auth/otp/request` (the "Resend Code" action). */
export function otpRequestErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return GENERIC;
  if (err.code === 'RATE_LIMITED') return 'You are requesting codes too fast. Wait a minute.';
  if (err.code === 'SERVICE_UNAVAILABLE') return SMS_UNAVAILABLE;
  if (err.code === 'NETWORK_ERROR') return NETWORK;
  return err.message || GENERIC;
}
