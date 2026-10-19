import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import authReducer, { sessionEnded, sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount } from '@/types';
import { takeNotificationRoute } from '@/lib/notifications/pendingRoute';
import { useIncomingNotificationLinks } from './useIncomingNotificationLinks';

jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;
let urlListener: ((event: { url: string }) => void) | undefined;

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: gDM => gDM({ serializableCheck: false }),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

const account = { id: 'u-1' } as AuthAccount;
const LINK = 'https://app.influsis.com/engagement/e-1?n=abc';

async function mount(initialUrl: string | null) {
  mockLinking.getInitialURL.mockResolvedValue(initialUrl);
  renderHook(() => useIncomingNotificationLinks(), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
}

function dispatch(action: Parameters<typeof store.dispatch>[0]) {
  act(() => {
    store.dispatch(action);
  });
}

function warmLink(url: string) {
  act(() => urlListener?.({ url }));
}

beforeEach(() => {
  store = makeStore(); // starts `restoring`
  takeNotificationRoute();
  urlListener = undefined;
  mockLinking.addEventListener.mockImplementation(((
    _type: string,
    listener: (event: { url: string }) => void,
  ) => {
    urlListener = listener;
    return { remove: jest.fn() };
  }) as never);
});

describe('useIncomingNotificationLinks', () => {
  test('a cold-start link while signed out is held', async () => {
    dispatch(sessionEnded());
    await mount(LINK);

    expect(takeNotificationRoute()).toBe('/engagement/e-1?n=abc');
  });

  test('a cold-start link while restoring that ends signed in is not held', async () => {
    await mount(LINK);
    dispatch(sessionEstablished(account));

    expect(takeNotificationRoute()).toBeNull();
  });

  test('a cold-start link while restoring that ends signed out is held', async () => {
    await mount(LINK);
    expect(takeNotificationRoute()).toBeNull();

    dispatch(sessionEnded());

    expect(takeNotificationRoute()).toBe('/engagement/e-1?n=abc');
  });

  test('a warm-start link while signed in is not held', async () => {
    dispatch(sessionEstablished(account));
    await mount(null);

    warmLink(LINK);

    expect(takeNotificationRoute()).toBeNull();
  });

  test('a link that is not for a notification screen is never held', async () => {
    dispatch(sessionEnded());
    await mount('https://app.influsis.com/order/1');
    warmLink('influsis://home');

    expect(takeNotificationRoute()).toBeNull();
  });

  test('two links while signed out keep the latest', async () => {
    dispatch(sessionEnded());
    await mount(LINK);

    warmLink('influsis://notification-settings');

    expect(takeNotificationRoute()).toBe('/notification-settings');
  });
});
