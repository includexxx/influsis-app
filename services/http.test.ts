import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '@/types';
import { ApiError, httpClient, request, setUnauthorizedHandler } from './http';
import { clearTokens, getTokens, setTokens } from './tokenStore';

const tokens: AuthTokens = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  tokenExpires: 2_000_000_000_000,
};
const nextTokens: AuthTokens = {
  token: 'access-2',
  refreshToken: 'refresh-2',
  tokenExpires: 2_000_000_100_000,
};

// A stand-in for a real axios adapter: it settles the response itself, so a
// non-2xx status rejects with an AxiosError carrying `.response` (what the
// built-in adapters do via `settle`).
function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(new AxiosError(`status ${status}`, 'ERR_BAD_RESPONSE', config, {}, response));
}

function envelope<T>(data: T) {
  return { success: true, statusCode: 200, message: 'ok', data, meta: null };
}

function errorBody(code: string, statusCode: number, errors: unknown = null) {
  return { success: false, code, statusCode, message: `err ${code}`, errors };
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error('expected the request to reject');
    },
    (err: unknown) => err as ApiError,
  );
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

beforeEach(async () => {
  await AsyncStorage.clear();
  await clearTokens();
  jest.clearAllMocks();
  setUnauthorizedHandler(() => {});
  adapter = jest.fn<Adapter>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpClient.defaults.adapter = adapter as any;
});

describe('request envelope handling', () => {
  test('unwraps a success envelope to data', async () => {
    adapter.mockImplementation(c => ok(c, envelope({ hi: 1 })));
    await expect(request<{ hi: number }>({ url: '/x' })).resolves.toEqual({ hi: 1 });
  });

  test('throws ApiError carrying the exact code / statusCode / field errors', async () => {
    adapter.mockImplementation(c => ok(c, errorBody('VALIDATION_FAILED', 422, { email: 'invalid' }), 422));
    const err = await rejection(request({ url: '/x', method: 'POST' }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('VALIDATION_FAILED');
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual({ email: 'invalid' });
  });

  test('a transport failure becomes ApiError NETWORK_ERROR', async () => {
    adapter.mockImplementation(c =>
      Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', c, {})),
    );
    const err = await rejection(request({ url: '/x' }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.statusCode).toBe(0);
  });

  test('an unparseable 5xx body becomes ApiError INTERNAL_ERROR', async () => {
    adapter.mockImplementation(c => ok(c, '<html>maintenance</html>', 500));
    const err = await rejection(request({ url: '/x' }));
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.statusCode).toBe(500);
  });
});

describe('bearer token request interceptor', () => {
  test('attaches the stored access token', async () => {
    await setTokens(tokens);
    adapter.mockImplementation(c => ok(c, envelope(null)));
    await request({ url: '/auth/me' });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer access-1');
  });

  test('sends no Authorization header when no token is stored', async () => {
    adapter.mockImplementation(c => ok(c, envelope(null)));
    await request({ url: '/auth/me' });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  test('sends no Authorization header when skipAuth is set', async () => {
    await setTokens(tokens);
    adapter.mockImplementation(c => ok(c, envelope(null)));
    await request({ url: '/auth/login', method: 'POST', skipAuth: true });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });
});

describe('401 refresh interceptor', () => {
  test('refreshes once, persists the pair, retries the original with the new token', async () => {
    await setTokens(tokens);
    adapter.mockImplementation(c => {
      if (c.url === '/auth/refresh') return ok(c, envelope(nextTokens));
      if (c._retry) return ok(c, envelope({ me: true }));
      return ok(c, errorBody('AUTH_TOKEN_EXPIRED', 401), 401);
    });

    await expect(request({ url: '/protected' })).resolves.toEqual({ me: true });

    const refreshCalls = adapter.mock.calls.filter(([c]) => c.url === '/auth/refresh');
    expect(refreshCalls).toHaveLength(1);
    expect(await getTokens()).toEqual(nextTokens);
    const retried = adapter.mock.calls.find(([c]) => c.url === '/protected' && c._retry);
    expect(retried?.[0].headers.Authorization).toBe('Bearer access-2');
  });

  test('concurrent 401s share a single refresh call', async () => {
    await setTokens(tokens);
    adapter.mockImplementation(c => {
      if (c.url === '/auth/refresh') return ok(c, envelope(nextTokens));
      if (c._retry) return ok(c, envelope({ ok: true }));
      return ok(c, errorBody('AUTH_TOKEN_EXPIRED', 401), 401);
    });

    await Promise.all([request({ url: '/a' }), request({ url: '/b' })]);

    expect(adapter.mock.calls.filter(([c]) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  test('a dead refresh clears the store, calls the unauthorized handler, rejects with ApiError', async () => {
    await setTokens(tokens);
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    adapter.mockImplementation(c => {
      if (c.url === '/auth/refresh') return ok(c, errorBody('AUTH_SESSION_REVOKED', 401), 401);
      return ok(c, errorBody('AUTH_TOKEN_EXPIRED', 401), 401);
    });

    const err = await rejection(request({ url: '/protected' }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('AUTH_SESSION_REVOKED');
    expect(await getTokens()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('a 401 with no stored refresh token rejects immediately, no refresh attempt', async () => {
    adapter.mockImplementation(c => ok(c, errorBody('AUTH_TOKEN_EXPIRED', 401), 401));
    const err = await rejection(request({ url: '/protected' }));
    expect(err.statusCode).toBe(401);
    expect(adapter.mock.calls.some(([c]) => c.url === '/auth/refresh')).toBe(false);
  });

  test('a 401 on a skipAuth request is passed through untouched', async () => {
    await setTokens(tokens);
    adapter.mockImplementation(c => ok(c, errorBody('AUTH_INVALID_CREDENTIALS', 401), 401));
    const err = await rejection(request({ url: '/auth/login', method: 'POST', skipAuth: true }));
    expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(adapter.mock.calls.some(([c]) => c.url === '/auth/refresh')).toBe(false);
  });
});
