import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react-native';

import { request } from '@/services/http';
import { businessDirectoryApi } from '../api/businessDirectoryApi';
import { useBusinessesFeed } from './useBusinessesFeed';

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code = 'UNKNOWN';
    statusCode = 500;
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { [businessDirectoryApi.reducerPath]: businessDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(businessDirectoryApi.middleware),
  });
}

// Renders the hook and records what every single render returned, so a
// one-render gap (rows arrived but not shown yet) can't hide between
// assertions.
function renderFeed() {
  store = makeStore();
  const renders: { loading: boolean; count: number }[] = [];
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = renderHook(
    () => {
      const feed = useBusinessesFeed();
      renders.push({ loading: feed.isInitialLoading, count: feed.businesses.length });
      return feed;
    },
    { wrapper },
  );
  return { ...hook, renders };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  store?.dispatch(businessDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useBusinessesFeed', () => {
  test('never reports "loaded and empty" while the first page is arriving', async () => {
    mockRequest.mockResolvedValue([{ userId: 'b1', businessName: 'Bkash' }] as never);
    const { result, renders } = renderFeed();

    await waitFor(() => expect(result.current.businesses).toHaveLength(1));

    // A render that is neither loading nor showing rows is the empty-state
    // flash: the screen would show "No businesses found" for a frame.
    expect(renders.filter(r => !r.loading && r.count === 0)).toEqual([]);
    expect(result.current.isInitialLoading).toBe(false);
  });

  test('an empty directory stops loading so the empty state can show', async () => {
    mockRequest.mockResolvedValue([] as never);
    const { result } = renderFeed();

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.businesses).toEqual([]);
    expect(result.current.isInitialError).toBe(false);
  });

  test('a failed first page stops loading and reports the error', async () => {
    mockRequest.mockRejectedValue(new Error('offline'));
    const { result } = renderFeed();

    await waitFor(() => expect(result.current.isInitialError).toBe(true));
    expect(result.current.isInitialLoading).toBe(false);
  });
});
