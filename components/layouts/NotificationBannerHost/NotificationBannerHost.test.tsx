import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { request } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import authReducer, { sessionEnded, sessionEstablished } from '@/slices/auth.slice';
import notificationsLive, { notificationReceived } from '@/slices/notificationsLive.slice';
import { applyReadState } from '@/scenes/notifications/utils/readState';
import { AuthAccount, NotificationItem } from '@/types';
import NotificationBannerHost, { BANNER_DURATION_MS } from './NotificationBannerHost';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

jest.mock(
  'react-native-safe-area-context',
  () =>
    (jest.requireActual('react-native-safe-area-context/jest/mock') as { default: object }).default,
);

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const { ApiError } = jest.requireMock<{ ApiError: new (b: object) => Error }>('@/services/http');
const mockRequest = request as jest.MockedFunction<typeof request>;

const high: NotificationItem = {
  id: 'n-high',
  eventType: 'delivery.changes_requested',
  category: 'delivery',
  urgency: 'high',
  title: 'Changes requested',
  body: 'Update your draft for "Eid Collection".',
  target: { type: 'delivery', id: 'eng-7', params: {} },
  readAt: null,
  resolvedAt: null,
  createdAt: '2026-10-17T09:30:00.000Z',
};

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      notificationsLive,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

function deliver(item: NotificationItem) {
  act(() => {
    store.dispatch(notificationReceived(item));
  });
}

const isReadLocally = (id: string) =>
  applyReadState([{ ...high, id }], store.getState().notificationsLive.read)[0].readAt !== null;

beforeEach(() => {
  jest.useFakeTimers();
  mockPush.mockReset();
  mockRequest.mockReset();
  mockRequest.mockImplementation((async () => ({
    id: 'n-high',
    readAt: '2026-10-17T10:00:00.000Z',
  })) as typeof request);
  store = makeStore();
  store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<NotificationBannerHost />', () => {
  test('a high-urgency notification shows the banner', () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    expect(screen.getByText('Changes requested')).toBeTruthy();
  });

  test('a normal one shows nothing', () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver({ ...high, id: 'n-normal', urgency: 'normal' });

    expect(screen.queryByTestId('in-app-banner')).toBeNull();
  });

  test('hides itself after 6 s', () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    act(() => {
      jest.advanceTimersByTime(BANNER_DURATION_MS - 1);
    });
    expect(screen.getByTestId('in-app-banner')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('in-app-banner')).toBeNull();
  });

  test('the close button hides it without opening anything', () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    fireEvent.press(screen.getByLabelText('Dismiss notification'));

    expect(screen.queryByTestId('in-app-banner')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test('a tap marks it read, calls NT3 and opens the mapped route', async () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Changes requested\./));
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(mockPush).toHaveBeenCalledWith('/engagement/eng-7/submit-delivery');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/notifications/n-high/read', method: 'PATCH' }),
    );
    expect(isReadLocally('n-high')).toBe(true);
    expect(screen.queryByTestId('in-app-banner')).toBeNull();
  });

  test('a failed NT3 reverts the read mark silently', async () => {
    mockRequest.mockImplementation((async () => {
      throw new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'gone' });
    }) as typeof request);
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    await act(async () => {
      fireEvent.press(screen.getByLabelText(/^Changes requested\./));
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(isReadLocally('n-high')).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/engagement/eng-7/submit-delivery');
  });

  test('renders nothing while signed out', () => {
    render(<NotificationBannerHost />, { wrapper });
    deliver(high);

    act(() => {
      store.dispatch(sessionEnded());
    });

    expect(screen.queryByTestId('in-app-banner')).toBeNull();
  });
});
