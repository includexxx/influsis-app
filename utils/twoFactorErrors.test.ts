import { describe, expect, test } from '@jest/globals';
import { ApiError } from '@/services';
import { twoFactorVerifyErrorMessage } from './twoFactorErrors';

function apiError(code: string, statusCode: number) {
  return new ApiError({ code, statusCode, message: `msg ${code}`, errors: null });
}

const SESSION_EXPIRED = 'Your sign-in session expired. Go back and sign in again.';

describe('twoFactorVerifyErrorMessage', () => {
  test('non-ApiError -> generic', () => {
    expect(twoFactorVerifyErrorMessage(new Error('boom'))).toBe(
      'Something went wrong. Please try again.',
    );
  });

  test('AUTH_MFA_INVALID_CODE', () => {
    expect(twoFactorVerifyErrorMessage(apiError('AUTH_MFA_INVALID_CODE', 401))).toBe(
      'That code is incorrect.',
    );
  });

  test('AUTH_TOKEN_INVALID -> session expired', () => {
    expect(twoFactorVerifyErrorMessage(apiError('AUTH_TOKEN_INVALID', 401))).toBe(SESSION_EXPIRED);
  });

  test('NOT_FOUND -> session expired', () => {
    expect(twoFactorVerifyErrorMessage(apiError('NOT_FOUND', 404))).toBe(SESSION_EXPIRED);
  });

  test('AUTH_MFA_REQUIRED', () => {
    expect(twoFactorVerifyErrorMessage(apiError('AUTH_MFA_REQUIRED', 401))).toBe(
      'Two-factor sign-in is not set up for this account.',
    );
  });

  test('ACCOUNT_SUSPENDED', () => {
    expect(twoFactorVerifyErrorMessage(apiError('ACCOUNT_SUSPENDED', 403))).toBe(
      'This account has been suspended.',
    );
  });

  test('ACCOUNT_DEACTIVATED', () => {
    expect(twoFactorVerifyErrorMessage(apiError('ACCOUNT_DEACTIVATED', 403))).toBe(
      'This account has been deactivated.',
    );
  });

  test('RATE_LIMITED', () => {
    expect(twoFactorVerifyErrorMessage(apiError('RATE_LIMITED', 429))).toBe(
      'Too many attempts. Wait a minute and try again.',
    );
  });

  test('NETWORK_ERROR', () => {
    expect(twoFactorVerifyErrorMessage(apiError('NETWORK_ERROR', 0))).toBe(
      'Cannot reach the server. Check your connection and try again.',
    );
  });

  test('unknown code -> the server message', () => {
    expect(twoFactorVerifyErrorMessage(apiError('TEAPOT', 418))).toBe('msg TEAPOT');
  });
});
