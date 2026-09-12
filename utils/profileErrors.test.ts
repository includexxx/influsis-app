import { describe, expect, test } from '@jest/globals';
import { ApiError } from '@/services';
import { handleConflictMessage, profileSubmitErrorMessage } from './profileErrors';

function apiError(code: string, statusCode = 422, errors: Record<string, string> | null = null) {
  return new ApiError({ code, statusCode, message: `err ${code}`, errors: errors ?? undefined });
}

describe('handleConflictMessage', () => {
  test('returns a message for HANDLE_TAKEN', () => {
    expect(handleConflictMessage(apiError('HANDLE_TAKEN', 409))).toMatch(/claimed/i);
  });

  test('returns a message for HANDLE_RESERVED', () => {
    expect(handleConflictMessage(apiError('HANDLE_RESERVED', 409))).toMatch(/reserved/i);
  });

  test('returns null for any other code', () => {
    expect(handleConflictMessage(apiError('VALIDATION_FAILED'))).toBeNull();
  });

  test('returns null for a non-ApiError', () => {
    expect(handleConflictMessage(new Error('boom'))).toBeNull();
  });
});

describe('profileSubmitErrorMessage', () => {
  test('routes a handle conflict through handleConflictMessage', () => {
    expect(profileSubmitErrorMessage(apiError('HANDLE_TAKEN', 409))).toMatch(/claimed/i);
  });

  test('VALIDATION_FAILED surfaces the first field error message', () => {
    const err = apiError('VALIDATION_FAILED', 422, { dateOfBirth: 'must be a valid date' });
    expect(profileSubmitErrorMessage(err)).toBe('must be a valid date');
  });

  test('VALIDATION_FAILED with no errors map falls back to a generic message', () => {
    expect(profileSubmitErrorMessage(apiError('VALIDATION_FAILED', 422, null))).toBe(
      'Some details need fixing.',
    );
  });

  test('MEDIA_INVALID_TYPE', () => {
    expect(profileSubmitErrorMessage(apiError('MEDIA_INVALID_TYPE'))).toMatch(/format/i);
  });

  test('MEDIA_TOO_LARGE', () => {
    expect(profileSubmitErrorMessage(apiError('MEDIA_TOO_LARGE', 413))).toMatch(/too large/i);
  });

  test('NOT_FOUND', () => {
    expect(profileSubmitErrorMessage(apiError('NOT_FOUND', 404))).toMatch(/profile/i);
  });

  test('INSUFFICIENT_ROLE', () => {
    expect(profileSubmitErrorMessage(apiError('INSUFFICIENT_ROLE', 403))).toMatch(
      /creator profile/i,
    );
  });

  test('NETWORK_ERROR', () => {
    expect(profileSubmitErrorMessage(apiError('NETWORK_ERROR', 0))).toMatch(/connection/i);
  });

  test('an unrecognized code falls back to the server message', () => {
    expect(profileSubmitErrorMessage(apiError('SOME_NEW_CODE', 500))).toBe('err SOME_NEW_CODE');
  });

  test('a non-ApiError falls back to the generic message', () => {
    expect(profileSubmitErrorMessage(new Error('boom'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
