import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '@/utils/config';
import { ApiEnvelope, ApiErrorBody, ApiErrorCode } from '@/types';
import { AuthTokens } from '@/types';
import { clearTokens, getTokens, peekAccessToken, setTokens } from './tokenStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Skip the bearer-token request interceptor and the 401 refresh retry. */
    skipAuth?: boolean;
    /** Internal: set once a request has already been retried after a refresh. */
    _retry?: boolean;
  }
}

const AUTH_PATHS_SKIP_REFRESH = new Set(['/auth/refresh']);

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly errors: Record<string, string> | null;
  readonly requestId?: string;

  constructor(body: {
    code: string;
    statusCode: number;
    message: string;
    errors?: ApiErrorBody['errors'];
    requestId?: string;
  }) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code as ApiErrorCode;
    this.statusCode = body.statusCode;
    this.errors = fieldErrors(body.errors);
    this.requestId = body.requestId;
  }
}

function fieldErrors(errors: ApiErrorBody['errors'] | undefined): Record<string, string> | null {
  if (!errors || typeof errors !== 'object') return null;
  const entries = Object.entries(errors);
  if (entries.every(([, v]) => typeof v === 'string')) {
    return errors as Record<string, string>;
  }
  return null;
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return typeof body === 'object' && body !== null && (body as { success?: unknown }).success === true;
}

function isErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { success?: unknown }).success === false &&
    typeof (body as { code?: unknown }).code === 'string'
  );
}

function toApiError(error: AxiosError): ApiError {
  const response = error.response;
  if (response) {
    if (isErrorBody(response.data)) return new ApiError(response.data);
    return new ApiError({
      code: response.status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
      statusCode: response.status,
      message: 'The server returned an unexpected response.',
    });
  }
  return new ApiError({
    code: 'NETWORK_ERROR',
    statusCode: 0,
    message: 'Network request failed. Check your connection and try again.',
  });
}

export const httpClient = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

httpClient.interceptors.request.use(cfg => {
  if (!cfg.skipAuth) {
    const token = peekAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    if (isEnvelope(body)) {
      response.data = body.data;
      return response;
    }
    if (isErrorBody(body)) throw new ApiError(body);
    throw new ApiError({
      code: 'UNKNOWN',
      statusCode: response.status,
      message: 'The server returned an unrecognized response.',
    });
  },
  async (error: AxiosError) => {
    const original = error.config;
    const apiError = toApiError(error);

    const canRefresh =
      apiError.statusCode === 401 &&
      original !== undefined &&
      !original.skipAuth &&
      !original._retry &&
      !AUTH_PATHS_SKIP_REFRESH.has(original.url ?? '');

    if (!canRefresh || !original) throw apiError;

    const tokens = await getTokens();
    if (!tokens?.refreshToken) throw apiError;

    const refreshed = await refreshTokens(tokens.refreshToken);

    original._retry = true;
    original.headers.Authorization = `Bearer ${refreshed.token}`;
    return httpClient(original);
  },
);

let refreshPromise: Promise<AuthTokens> | null = null;
let unauthorizedHandler: () => void = () => {};

/** Registered once by the session layer (19b) to end the session on a dead refresh. */
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = doRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(refreshToken: string): Promise<AuthTokens> {
  try {
    const next = await request<AuthTokens>({
      url: '/auth/refresh',
      method: 'POST',
      data: {},
      skipAuth: true,
      _retry: true,
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    await setTokens(next);
    return next;
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : toApiError(err as AxiosError);
    if (apiErr.statusCode === 401 || apiErr.statusCode === 403) {
      await clearTokens();
      unauthorizedHandler();
    }
    throw apiErr;
  }
}

export async function request<T>(cfg: AxiosRequestConfig): Promise<T> {
  const response = await httpClient(cfg);
  return response.data as T;
}
