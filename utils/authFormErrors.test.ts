import { describe, expect, jest, test } from '@jest/globals';
import { ApiError } from '@/services';
import { applyApiError } from './authFormErrors';

function apiError(code: string, statusCode: number, errors: Record<string, string> | null = null) {
  return new ApiError({ code, statusCode, message: `msg ${code}`, errors });
}

describe('applyApiError', () => {
  test('non-ApiError -> a generic root message', () => {
    const setError = jest.fn();
    applyApiError(new Error('boom'), setError, ['email']);
    expect(setError).toHaveBeenCalledWith('root', {
      message: 'Something went wrong. Please try again.',
    });
  });

  test('VALIDATION_FAILED field map -> matching fields only', () => {
    const setError = jest.fn();
    applyApiError(
      apiError('VALIDATION_FAILED', 422, { password: 'too short', roleKey: 'not allowed' }),
      setError,
      ['email', 'password'],
    );
    expect(setError).toHaveBeenCalledWith('password', { message: 'too short' });
    expect(setError).toHaveBeenCalledTimes(1);
  });

  test('VALIDATION_FAILED with no matching field -> root', () => {
    const setError = jest.fn();
    applyApiError(apiError('VALIDATION_FAILED', 422, { roleKey: 'not allowed' }), setError, [
      'email',
      'password',
    ]);
    expect(setError).toHaveBeenCalledWith('root', { message: 'msg VALIDATION_FAILED' });
  });

  test('AUTH_INVALID_CREDENTIALS -> fixed root copy', () => {
    const setError = jest.fn();
    applyApiError(apiError('AUTH_INVALID_CREDENTIALS', 401), setError, ['identifier', 'password']);
    expect(setError).toHaveBeenCalledWith('root', {
      message: 'The email or password is incorrect.',
    });
  });

  test('ALREADY_EXISTS -> the email field', () => {
    const setError = jest.fn();
    applyApiError(apiError('ALREADY_EXISTS', 409), setError, ['email', 'password']);
    expect(setError).toHaveBeenCalledWith('email', {
      message: 'An account with this email already exists.',
    });
  });

  test('a 403 account code -> its fixed root copy', () => {
    const setError = jest.fn();
    applyApiError(apiError('ACCOUNT_PENDING_VERIFICATION', 403), setError, [
      'identifier',
      'password',
    ]);
    expect(setError).toHaveBeenCalledWith('root', {
      message: 'Verify your account to continue. Check your email for the code.',
    });
  });

  test('NETWORK_ERROR -> its fixed root copy', () => {
    const setError = jest.fn();
    applyApiError(apiError('NETWORK_ERROR', 0), setError, ['identifier', 'password']);
    expect(setError).toHaveBeenCalledWith('root', {
      message: 'Cannot reach the server. Check your connection and try again.',
    });
  });

  test('an unknown code -> root with the server message', () => {
    const setError = jest.fn();
    applyApiError(apiError('TEAPOT', 418), setError, ['email']);
    expect(setError).toHaveBeenCalledWith('root', { message: 'msg TEAPOT' });
  });
});
