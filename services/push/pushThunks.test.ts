import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount } from '@/types';
import { registerDevice, requestPushPermission, unregisterDevice } from './registration';
import { disablePushOnDevice, enablePushOnDevice, releasePushDevice } from './pushThunks';

const mockCalls: string[] = [];
const mockStorage = {
  setOptedOut: jest.fn(async (userId: string, off: boolean) => {
    mockCalls.push(`setOptedOut:${userId}:${off}`);
  }),
};

jest.mock('./deps', () => ({ pushDeps: () => ({ storage: mockStorage }) }));

jest.mock('./registration', () => ({
  requestPushPermission: jest.fn(async () => {
    mockCalls.push('requestPermission');
    return 'granted';
  }),
  registerDevice: jest.fn(async () => {
    mockCalls.push('register');
    return 'registered';
  }),
  unregisterDevice: jest.fn(async () => {
    mockCalls.push('unregister');
  }),
  readPushPermission: jest.fn(async () => 'granted'),
}));

const request = requestPushPermission as unknown as jest.Mock<() => Promise<string>>;

function makeStore() {
  const store = configureStore({
    reducer: { auth: authReducer },
    middleware: gDM => gDM({ serializableCheck: false }),
  });
  store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
  return store;
}

beforeEach(() => {
  mockCalls.length = 0;
  jest.clearAllMocks();
});

describe('push device thunks', () => {
  test('enable forgets the opt-out, asks the OS, then registers', async () => {
    const result = await makeStore().dispatch(enablePushOnDevice()).unwrap();

    expect(mockCalls).toEqual(['setOptedOut:u-1:false', 'requestPermission', 'register']);
    expect(registerDevice).toHaveBeenCalledWith(expect.anything(), { force: true });
    expect(result).toEqual({ permission: 'granted', result: 'registered' });
  });

  test('enable does not register when the OS says no', async () => {
    request.mockResolvedValueOnce('blocked');

    const result = await makeStore().dispatch(enablePushOnDevice()).unwrap();

    expect(registerDevice).not.toHaveBeenCalled();
    expect(result).toEqual({ permission: 'blocked', result: null });
  });

  test('disable remembers the opt-out, then unregisters', async () => {
    await makeStore().dispatch(disablePushOnDevice()).unwrap();

    expect(mockCalls).toEqual(['setOptedOut:u-1:true', 'unregister']);
  });

  test('logout unregisters without touching the opt-out', async () => {
    await makeStore().dispatch(releasePushDevice()).unwrap();

    expect(mockCalls).toEqual(['unregister']);
    expect(unregisterDevice).toHaveBeenCalled();
  });
});
