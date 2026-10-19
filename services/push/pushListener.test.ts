import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { restoreSession, sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount } from '@/types';
import { syncPushDevice } from './pushThunks';
import pushListener from './pushListener';

jest.mock('./pushThunks', () => ({
  syncPushDevice: jest.fn((arg: { force: boolean }) => ({ type: 'push/sync', payload: arg })),
}));

const sync = syncPushDevice as unknown as jest.Mock;
const account = { id: 'u-1' } as AuthAccount;

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: gDM => gDM({ serializableCheck: false }).prepend(pushListener.middleware),
  });
}

beforeEach(() => {
  sync.mockClear();
});

describe('pushListener', () => {
  test('every sign-in forces registration', () => {
    const store = makeStore();
    store.dispatch(sessionEstablished(account));
    expect(sync).toHaveBeenCalledWith({ force: true });
  });

  test('a restored session registers without forcing', () => {
    const store = makeStore();
    store.dispatch(restoreSession.fulfilled(account, 'req-1'));
    expect(sync).toHaveBeenCalledWith({ force: false });
  });

  test('a restore that finds no session registers nothing', () => {
    const store = makeStore();
    store.dispatch(restoreSession.fulfilled(null, 'req-1'));
    expect(sync).not.toHaveBeenCalled();
  });
});
