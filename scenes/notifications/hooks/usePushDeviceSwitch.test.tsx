import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import push, {
  availabilityChanged,
  deviceRegistered,
  permissionChanged,
} from '@/slices/push.slice';
import { getPushMessaging } from '@/services/push/messaging';
import {
  disablePushOnDevice,
  enablePushOnDevice,
  refreshPushPermission,
} from '@/services/push/pushThunks';
import { usePushDeviceSwitch } from './usePushDeviceSwitch';

jest.mock('@/services/push/messaging', () => ({ getPushMessaging: jest.fn(() => ({})) }));

jest.mock('@/services/push/pushThunks', () => ({
  enablePushOnDevice: jest.fn(() => ({ type: 'push/enable' })),
  disablePushOnDevice: jest.fn(() => ({ type: 'push/disable' })),
  refreshPushPermission: jest.fn(() => ({ type: 'push/refreshPermission' })),
}));

const messaging = getPushMessaging as unknown as jest.Mock<() => object | null>;
const enable = enablePushOnDevice as unknown as jest.Mock;
const disable = disablePushOnDevice as unknown as jest.Mock;
const refresh = refreshPushPermission as unknown as jest.Mock;

type AppStateHandler = (state: string) => void;
let appStateHandlers: AppStateHandler[];
const originalOS = Platform.OS;

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { push },
    middleware: gDM => gDM({ serializableCheck: false }),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

const mount = () => renderHook(() => usePushDeviceSwitch(), { wrapper });

beforeEach(() => {
  jest.clearAllMocks();
  messaging.mockReturnValue({});
  store = makeStore();
  appStateHandlers = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _: string,
    handler: AppStateHandler,
  ) => {
    appStateHandlers.push(handler);
    return { remove: jest.fn() };
  }) as never);
  jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  jest.restoreAllMocks();
});

describe('usePushDeviceSwitch', () => {
  test('on: registered and allowed', () => {
    store.dispatch(permissionChanged('granted'));
    store.dispatch(deviceRegistered('dev-1'));
    expect(mount().result.current.state).toBe('on');
  });

  test('provisional counts as allowed', () => {
    store.dispatch(permissionChanged('provisional'));
    store.dispatch(deviceRegistered('dev-1'));
    expect(mount().result.current.state).toBe('on');
  });

  test('off: allowed but not registered here', () => {
    store.dispatch(permissionChanged('granted'));
    expect(mount().result.current.state).toBe('off');
  });

  test('off: not asked yet', () => {
    expect(mount().result.current.state).toBe('off');
  });

  test('blocked: Android "don\'t ask again"', () => {
    store.dispatch(permissionChanged('blocked'));
    expect(mount().result.current.state).toBe('blocked');
  });

  test('blocked: denied on iOS, which cannot ask again', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    store.dispatch(permissionChanged('denied'));
    expect(mount().result.current.state).toBe('blocked');
  });

  test('Android denied (can still ask) stays off and switchable', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    store.dispatch(permissionChanged('denied'));
    expect(mount().result.current.state).toBe('off');
  });

  test('unavailable: no push in this build', () => {
    messaging.mockReturnValue(null);
    store.dispatch(permissionChanged('granted'));
    expect(mount().result.current.state).toBe('unavailable');
  });

  test('unavailable: getToken failed on this device', () => {
    store.dispatch(availabilityChanged('unavailable'));
    expect(mount().result.current.state).toBe('unavailable');
  });

  test('toggling off disables push on this device', async () => {
    store.dispatch(permissionChanged('granted'));
    store.dispatch(deviceRegistered('dev-1'));
    const { result } = mount();

    await act(async () => {
      await result.current.toggle();
    });

    expect(disable).toHaveBeenCalledTimes(1);
    expect(enable).not.toHaveBeenCalled();
  });

  test('toggling on enables push on this device', async () => {
    const { result } = mount();

    await act(async () => {
      await result.current.toggle();
    });

    expect(enable).toHaveBeenCalledTimes(1);
  });

  test('blocked or unavailable: toggle does nothing', async () => {
    store.dispatch(permissionChanged('blocked'));
    const { result } = mount();

    await act(async () => {
      await result.current.toggle();
    });

    expect(enable).not.toHaveBeenCalled();
    expect(disable).not.toHaveBeenCalled();
  });

  test('re-reads the permission on mount and on every return to the app', () => {
    mount();
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => appStateHandlers.forEach(handler => handler('background')));
    act(() => appStateHandlers.forEach(handler => handler('active')));

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  test('no push in this build: never asks the OS', () => {
    messaging.mockReturnValue(null);
    mount();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('openSettings opens the phone settings', () => {
    mount().result.current.openSettings();
    expect(Linking.openSettings).toHaveBeenCalled();
  });
});
