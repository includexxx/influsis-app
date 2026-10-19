import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { request } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount, NotificationPreference } from '@/types';
import NotificationSettings, { LOCKED_NOTE } from './NotificationSettings';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

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
type RequestConfig = { url: string; method?: string; data?: { email?: Record<string, boolean> } };

function pref(category: string, enabled: boolean, locked: string[] = []): NotificationPreference {
  return {
    category,
    inApp: { enabled: true, locked: true },
    email: { enabled, lockedEvents: locked, optionalEvents: ['x'] },
    push: { enabled: true, lockedEvents: locked, optionalEvents: ['x'] },
  };
}

const PREFS = [
  pref('engagement', true, ['engagement.accepted']),
  pref('offer', true),
  pref('review', false),
];

function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

const calls = (method: string) =>
  mockRequest.mock.calls
    .map(([c]) => c as RequestConfig)
    .filter(c => (c.method ?? 'GET') === method);

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [notificationsApi.reducerPath]: notificationsApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

function signIn(emailVerified: boolean) {
  store.dispatch(
    sessionEstablished({ id: 'u-1', email: 'c@influsis.test', emailVerified } as AuthAccount),
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  store = makeStore();
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<NotificationSettings />', () => {
  test('lists the email toggles in NT5 order with labels and the locked note', async () => {
    signIn(true);
    answerWith(() => PREFS);
    render(<NotificationSettings />, { wrapper });

    expect(await screen.findByText('Invitations and requests')).toBeTruthy();
    const rows = screen.getAllByTestId(/^email-row-/).map(r => r.props.testID);
    expect(rows).toEqual(['email-row-engagement', 'email-row-offer', 'email-row-review']);
    expect(screen.getByText(`New invitations and declined requests. ${LOCKED_NOTE}`)).toBeTruthy();
    expect(screen.getByText('Counter-offers')).toBeTruthy();
    expect(screen.getByText('In-app notifications are always on.')).toBeTruthy();
    expect(screen.getByLabelText('Email for Reviews').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
  });

  test('a toggle switches at once and saves just that category', async () => {
    signIn(true);
    answerWith(cfg =>
      cfg.method === 'PATCH' ? [PREFS[0], pref('offer', false), PREFS[2]] : PREFS,
    );
    render(<NotificationSettings />, { wrapper });
    await screen.findByText('Offers');

    fireEvent.press(screen.getByLabelText('Email for Offers'));

    expect(screen.getByLabelText('Email for Offers').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
    await waitFor(() => expect(calls('PATCH')).toHaveLength(1));
    expect(calls('PATCH')[0]).toEqual(
      expect.objectContaining({
        url: '/notifications/preferences',
        data: { email: { offer: false } },
      }),
    );
  });

  test('a failed save puts the toggle back and says so', async () => {
    signIn(true);
    answerWith(cfg => {
      if (cfg.method === 'PATCH') {
        throw new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' });
      }
      return PREFS;
    });
    render(<NotificationSettings />, { wrapper });
    await screen.findByText('Offers');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Email for Offers'));
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(await screen.findByText("Couldn't save your email settings. Try again.")).toBeTruthy();
    expect(screen.getByLabelText('Email for Offers').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });

  test('loading, then an error with retry', async () => {
    signIn(true);
    let fail = true;
    answerWith(() => {
      if (fail) throw new ApiError({ code: 'NETWORK_ERROR', statusCode: 0, message: 'offline' });
      return PREFS;
    });
    render(<NotificationSettings />, { wrapper });

    expect(screen.getByTestId('notification-settings-loading')).toBeTruthy();
    expect(await screen.findByText("Couldn't load your settings")).toBeTruthy();

    fail = false;
    fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('Offers')).toBeTruthy();
  });

  test('says so when there are no email settings', async () => {
    signIn(true);
    answerWith(() => [{ ...PREFS[0], email: null }]);
    render(<NotificationSettings />, { wrapper });

    expect(await screen.findByText('There are no email settings for your account.')).toBeTruthy();
  });

  test('without a verified email it explains why and never asks for NT5', async () => {
    signIn(false);
    answerWith(() => PREFS);
    render(<NotificationSettings />, { wrapper });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(
      screen.getByText('Add an email to get important updates when the app is closed.'),
    ).toBeTruthy();
    expect(screen.queryByTestId(/^email-row-/)).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
