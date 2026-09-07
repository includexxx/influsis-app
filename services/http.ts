import config from '@/utils/config';
import { ApiEnvelope, ApiErrorBody, ApiErrorCode } from '@/types';

const baseUrl = `${(config.apiUrl ?? '').replace(/\/+$/, '')}/api/v1`;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly errors: Record<string, string> | null;
  readonly requestId?: string;

  constructor(body: {
    code: string;
    statusCode: number;
    message: string;
    errors?: Record<string, string> | null;
    requestId?: string;
  }) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.statusCode = body.statusCode;
    this.errors = body.errors ?? null;
    this.requestId = body.requestId;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({
      code: 'NETWORK_ERROR',
      statusCode: 0,
      message: 'Network request failed. Check your connection and try again.',
    });
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new ApiError({
      code: response.ok ? 'UNKNOWN' : 'INTERNAL_ERROR',
      statusCode: response.status,
      message: 'The server returned an unexpected response.',
    });
  }

  const envelope = parsed as ApiEnvelope<T> | ApiErrorBody | null;
  if (envelope?.success === true) return envelope.data;
  if (envelope?.success === false) throw new ApiError(envelope);

  throw new ApiError({
    code: 'UNKNOWN',
    statusCode: response.status,
    message: 'The server returned an unrecognized response.',
  });
}
