import { describe, expect, test } from '@jest/globals';
import { ApiError } from '@/services/http';
import { authErrorFieldErrors, authErrorMessage } from './authError';

const err = (code: string, extra: { errors?: Record<string, string> | null } = {}) =>
  new ApiError({ code, statusCode: 400, message: code, errors: extra.errors ?? null });

describe('authErrorMessage', () => {
  const cases: [string, string][] = [
    ['AUTH_INVALID_CREDENTIALS', 'Incorrect email or password.'],
    ['ALREADY_EXISTS', 'An account with this email already exists.'],
    ['ACCOUNT_SUSPENDED', 'This account has been suspended. Contact support.'],
    ['ACCOUNT_DEACTIVATED', 'This account has been deactivated.'],
    ['ACCOUNT_PENDING_VERIFICATION', 'This account is not active yet.'],
    ['RATE_LIMITED', 'Too many attempts. Please wait a moment and try again.'],
    ['NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.'],
  ];

  test.each(cases)('%s maps to its message', (code, message) => {
    expect(authErrorMessage(err(code))).toBe(message);
  });

  test('VALIDATION_FAILED uses the first field error', () => {
    expect(
      authErrorMessage(err('VALIDATION_FAILED', { errors: { password: 'too short' } })),
    ).toBe('too short');
  });

  test('VALIDATION_FAILED with no errors falls back to a generic sentence', () => {
    expect(authErrorMessage(err('VALIDATION_FAILED'))).toBe(
      'Please check the form and try again.',
    );
  });

  test('an unmapped code (INTERNAL_ERROR) uses the default message', () => {
    expect(authErrorMessage(err('INTERNAL_ERROR'))).toBe('Something went wrong. Please try again.');
  });

  test('an unknown server code uses the default message', () => {
    expect(authErrorMessage(err('SOME_NEW_CODE'))).toBe('Something went wrong. Please try again.');
  });
});

describe('authErrorFieldErrors', () => {
  test('humanizes a known 409 email token', () => {
    expect(
      authErrorFieldErrors(err('ALREADY_EXISTS', { errors: { email: 'emailAlreadyExists' } })),
    ).toEqual({ email: 'An account with this email already exists.' });
  });

  test('passes a 422 class-validator string through unchanged', () => {
    expect(
      authErrorFieldErrors(
        err('VALIDATION_FAILED', {
          errors: { password: 'must be longer than or equal to 8 characters' },
        }),
      ),
    ).toEqual({ password: 'must be longer than or equal to 8 characters' });
  });

  test('drops keys that are not email / password / phone', () => {
    expect(
      authErrorFieldErrors(
        err('VALIDATION_FAILED', { errors: { roleKey: 'roleNotAllowed', email: 'bad' } }),
      ),
    ).toEqual({ email: 'bad' });
  });

  test('null errors yields an empty object', () => {
    expect(authErrorFieldErrors(err('INTERNAL_ERROR'))).toEqual({});
  });
});
