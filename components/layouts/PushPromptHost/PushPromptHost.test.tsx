import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import push, { promptShown } from '@/slices/push.slice';
import { AuthAccount } from '@/types';
import PushPromptHost from './PushPromptHost';

// See OptionSheet.test.tsx: force BottomSheet's plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

let mockAnswer: { permission: string; result: string | null } | Error;

jest.mock('@/services/push/pushThunks', () => {
  const { createAsyncThunk } =
    jest.requireActual<typeof import('@reduxjs/toolkit')>('@reduxjs/toolkit');
  return {
    askPushPermission: createAsyncThunk('push/ask', async () => {
      if (mockAnswer instanceof Error) throw mockAnswer;
      return mockAnswer;
    }),
  };
});

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, push },
    middleware: gDM => gDM({ serializableCheck: false }),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

async function turnOn() {
  await act(async () => {
    fireEvent.press(screen.getByText('Turn on'));
  });
}

beforeEach(() => {
  store = makeStore();
  store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
  mockAnswer = { permission: 'granted', result: 'registered' };
});

describe('<PushPromptHost />', () => {
  test('shows nothing until the explainer is requested', () => {
    render(<PushPromptHost />, { wrapper });
    expect(screen.queryByTestId('push-permission-sheet')).toBeNull();
  });

  test('granted: asks the OS, registers, and closes', async () => {
    store.dispatch(promptShown());
    render(<PushPromptHost />, { wrapper });

    await turnOn();

    expect(store.getState().push.promptVisible).toBe(false);
    expect(screen.queryByTestId('push-permission-sheet')).toBeNull();
  });

  test.each(['denied', 'blocked'])(
    '%s: stays open pointing to the phone settings',
    async permission => {
      mockAnswer = { permission, result: null };
      store.dispatch(promptShown());
      render(<PushPromptHost />, { wrapper });

      await turnOn();

      expect(
        screen.getByText('You can turn notifications on later in your phone settings'),
      ).toBeTruthy();
      expect(store.getState().push.promptVisible).toBe(true);
    },
  );

  test('granted but no token: says push is unavailable', async () => {
    mockAnswer = { permission: 'granted', result: 'unavailable' };
    store.dispatch(promptShown());
    render(<PushPromptHost />, { wrapper });

    await turnOn();

    expect(screen.getByText('Push unavailable on this device')).toBeTruthy();
  });

  test('Not now closes it', () => {
    store.dispatch(promptShown());
    render(<PushPromptHost />, { wrapper });

    fireEvent.press(screen.getByText('Not now'));

    expect(store.getState().push.promptVisible).toBe(false);
  });
});
