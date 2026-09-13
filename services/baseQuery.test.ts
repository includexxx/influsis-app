import { describe, expect, jest, test } from '@jest/globals';
import { ApiError } from './http';

const mockRequest = jest.fn<(cfg: unknown) => Promise<unknown>>();

jest.mock('./http', () => {
  const actual = jest.requireActual('./http') as object;
  return { ...actual, request: (cfg: unknown) => mockRequest(cfg) };
});

// Imported after the mock so it picks up the mocked `request`.
// eslint-disable-next-line import/first
import { axiosBaseQuery } from './baseQuery';

describe('axiosBaseQuery', () => {
  test('a resolved request() is returned as { data }', async () => {
    mockRequest.mockResolvedValueOnce({ hello: 'world' });

    const result = await axiosBaseQuery()(
      { url: '/anything', method: 'GET' },

      {} as any,
      {},
    );

    expect(result).toEqual({ data: { hello: 'world' } });
  });

  test('an ApiError rejection is passed through as { error }', async () => {
    const apiError = new ApiError({
      code: 'VALIDATION_FAILED',
      statusCode: 422,
      message: 'Invalid.',
    });
    mockRequest.mockRejectedValueOnce(apiError);

    const result = await axiosBaseQuery()(
      { url: '/anything', method: 'POST' },

      {} as any,
      {},
    );

    expect(result.error).toBe(apiError);
  });

  test('a non-ApiError rejection is normalized to a synthetic UNKNOWN ApiError', async () => {
    mockRequest.mockRejectedValueOnce(new Error('boom'));

    const result = await axiosBaseQuery()(
      { url: '/anything', method: 'GET' },

      {} as any,
      {},
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('UNKNOWN');
    expect((result.error as ApiError).statusCode).toBe(0);
  });
});
