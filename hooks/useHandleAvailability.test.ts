import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(body: { statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

import { request, ApiError } from '@/services/http';
import { useHandleAvailability } from './useHandleAvailability';

const mockRequest = request as jest.MockedFunction<typeof request>;

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

async function flush(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('useHandleAvailability', () => {
  test('a 200 with available: true resolves to "available"', async () => {
    mockRequest.mockResolvedValue({ available: true });
    const { result } = renderHook(() => useHandleAvailability('ayesha_rahman', true, 400));

    expect(result.current.state).toBe('checking');
    await flush(400);

    expect(result.current.state).toBe('available');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/handles/ayesha_rahman/availability',
        method: 'GET',
        skipAuth: true,
      }),
    );
  });

  test('a 200 with available: false maps reason to "taken" / "reserved"', async () => {
    mockRequest.mockResolvedValueOnce({ available: false, reason: 'taken' });
    const taken = renderHook(() => useHandleAvailability('taken_one', true, 400));
    await flush(400);
    expect(taken.result.current.state).toBe('taken');

    mockRequest.mockResolvedValueOnce({ available: false, reason: 'reserved' });
    const reserved = renderHook(() => useHandleAvailability('admin', true, 400));
    await flush(400);
    expect(reserved.result.current.state).toBe('reserved');
  });

  test('a 422 ApiError maps to "invalid", any other error to "error"', async () => {
    mockRequest.mockRejectedValueOnce(
      new ApiError({ code: 'UNPROCESSABLE_ENTITY', statusCode: 422, message: 'bad format' }),
    );
    const invalid = renderHook(() => useHandleAvailability('weird', true, 400));
    await flush(400);
    expect(invalid.result.current.state).toBe('invalid');

    mockRequest.mockRejectedValueOnce(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' }),
    );
    const errored = renderHook(() => useHandleAvailability('server_down', true, 400));
    await flush(400);
    expect(errored.result.current.state).toBe('error');
  });

  test('stays "idle" and never calls the endpoint while not enabled', async () => {
    const { result } = renderHook(() => useHandleAvailability('ayesha_rahman', false, 400));
    expect(result.current.state).toBe('idle');
    await flush(1000);
    expect(result.current.state).toBe('idle');
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test('drops a superseded response - only the latest handle wins', async () => {
    const deferred: { resolve: (value: unknown) => void } = { resolve: () => {} };
    mockRequest.mockImplementationOnce(
      (() =>
        new Promise(resolve => {
          deferred.resolve = resolve;
        })) as unknown as typeof request,
    );
    mockRequest.mockResolvedValueOnce({ available: true });

    const { result, rerender } = renderHook(
      ({ handle }: { handle: string }) => useHandleAvailability(handle, true, 400),
      { initialProps: { handle: 'first_try' } },
    );

    await flush(400); // first request fires, still pending
    rerender({ handle: 'second_try' }); // supersedes the first
    await flush(400); // second request fires and resolves available

    await act(async () => {
      deferred.resolve({ available: false, reason: 'taken' }); // late - must be ignored
    });

    expect(result.current.state).toBe('available');
  });
});
