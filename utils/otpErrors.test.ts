import { describe, expect, test } from '@jest/globals';
import { ApiError } from '@/services';
import { otpRequestErrorMessage, otpVerifyErrorMessage } from './otpErrors';

function apiError(code: string, statusCode: number, errors: Record<string, string> | null = null) {
  return new ApiError({ code, statusCode, message: `msg ${code}`, errors });
}

describe('otpVerifyErrorMessage', () => {
  test('wrong code', () => {
    expect(otpVerifyErrorMessage(apiError('VALIDATION_FAILED', 422, { code: 'incorrect' }))).toBe(
      'The code you entered is incorrect.',
    );
  });

  test('expired code', () => {
    expect(
      otpVerifyErrorMessage(apiError('VALIDATION_FAILED', 422, { code: 'invalidOrExpired' })),
    ).toBe('That code has expired. Request a new one.');
  });

  test('no account for the destination', () => {
    expect(otpVerifyErrorMessage(apiError('NOT_FOUND', 404))).toBe(
      'We could not find an account for that email.',
    );
  });

  test('rate limited', () => {
    expect(otpVerifyErrorMessage(apiError('RATE_LIMITED', 429))).toBe(
      'Too many attempts. Wait a minute and try again.',
    );
  });

  test('network error', () => {
    expect(otpVerifyErrorMessage(apiError('NETWORK_ERROR', 0))).toBe(
      'Cannot reach the server. Check your connection and try again.',
    );
  });

  test('non-ApiError -> generic', () => {
    expect(otpVerifyErrorMessage(new Error('boom'))).toBe(
      'Something went wrong. Please try again.',
    );
  });

  test('unknown code -> the server message', () => {
    expect(otpVerifyErrorMessage(apiError('TEAPOT', 418))).toBe('msg TEAPOT');
  });
});

describe('otpRequestErrorMessage', () => {
  test('rate limited', () => {
    expect(otpRequestErrorMessage(apiError('RATE_LIMITED', 429))).toBe(
      'You are requesting codes too fast. Wait a minute.',
    );
  });

  test('network error', () => {
    expect(otpRequestErrorMessage(apiError('NETWORK_ERROR', 0))).toBe(
      'Cannot reach the server. Check your connection and try again.',
    );
  });

  test('non-ApiError -> generic', () => {
    expect(otpRequestErrorMessage('nope')).toBe('Something went wrong. Please try again.');
  });
});
