import { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { Method } from 'axios';
import { ApiError, request } from './http';

export interface BaseQueryArgs {
  url: string;
  method?: Method;
  data?: unknown;
  params?: unknown;
  skipAuth?: boolean;
}

// Thin adapter over services/http.ts: request() already unwraps the response
// envelope and normalizes every failure to ApiError, and httpClient owns the
// bearer-token attach plus the one-shot 401 refresh (19a). This only reshapes
// the result into RTK Query's { data } | { error } contract.
//
// Deliberately no `headers` field on BaseQueryArgs: nothing that flows
// through RTK Query needs a per-request Content-Type override. Media upload
// (services/mediaUpload.ts) needs exactly that (multipart), so it calls
// request() directly instead of going through a createApi endpoint.
export const axiosBaseQuery = (): BaseQueryFn<BaseQueryArgs, unknown, ApiError> => async args => {
  try {
    return { data: await request<unknown>(args) };
  } catch (err) {
    if (err instanceof ApiError) return { error: err };
    return {
      error: new ApiError({
        code: 'UNKNOWN',
        statusCode: 0,
        message: 'The request failed unexpectedly.',
      }),
    };
  }
};
