import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('@/utils/config', () => ({
  __esModule: true,
  default: { apiUrl: 'https://api.test.example/api/v1', env: 'development' },
}));

import { ApiError, request } from './http';

const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as unknown as typeof fetch;

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('request', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test('unwraps and returns data on a success envelope', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ success: true, statusCode: 200, data: { id: '1' }, meta: null }),
    );

    await expect(request('/auth/me')).resolves.toEqual({ id: '1' });
  });

  test('joins the base URL and /api/v1 without a double slash', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true, data: null, meta: null }));

    await request('/auth/logout', { method: 'POST' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.example/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('throws ApiError carrying the exact code, statusCode and errors on a failure envelope', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        {
          success: false,
          statusCode: 409,
          code: 'ALREADY_EXISTS',
          message: 'An account with this email already exists.',
          errors: { email: 'emailAlreadyExists' },
          requestId: 'req-1',
        },
        false,
        409,
      ),
    );

    await expect(request('/auth/register', { method: 'POST' })).rejects.toMatchObject({
      code: 'ALREADY_EXISTS',
      statusCode: 409,
      errors: { email: 'emailAlreadyExists' },
      requestId: 'req-1',
    });
  });

  test('throws ApiError code NETWORK_ERROR when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/auth/me')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      statusCode: 0,
    });
  });

  test('throws ApiError code UNKNOWN on a 2xx body that is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    } as unknown as Response);

    await expect(request('/auth/me')).rejects.toMatchObject({ code: 'UNKNOWN' });
  });

  test('sends the Authorization header only when a token is passed', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true, data: null, meta: null }));

    await request('/auth/me');
    expect((mockFetch.mock.calls[0][1] as RequestInit).headers).toEqual({
      'Content-Type': 'application/json',
    });

    await request('/auth/me', { token: 'access-123' });
    expect((mockFetch.mock.calls[1][1] as RequestInit).headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-123',
    });
  });

  test('ApiError exposes name and message from the envelope', () => {
    const err = new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Nope.' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Nope.');
  });
});
