import { describe, expect, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { clearSessionState, sessionEstablished } from './auth.slice';
import reducer, {
  availabilityChanged,
  deviceCleared,
  deviceRegistered,
  permissionChanged,
  promptClosed,
  promptShown,
} from './push.slice';

const initial = reducer(undefined, { type: '@@init' });

describe('push slice', () => {
  test('starts unknown, with no device and no prompt', () => {
    expect(initial).toEqual({
      permission: 'unknown',
      availability: 'unknown',
      deviceId: null,
      promptVisible: false,
    });
  });

  test('records permission, availability, the device and the prompt', () => {
    let state = reducer(initial, permissionChanged('provisional'));
    state = reducer(state, availabilityChanged('available'));
    state = reducer(state, deviceRegistered('dev-1'));
    state = reducer(state, promptShown());
    expect(state).toEqual({
      permission: 'provisional',
      availability: 'available',
      deviceId: 'dev-1',
      promptVisible: true,
    });

    state = reducer(state, deviceCleared());
    state = reducer(state, promptClosed());
    expect(state.deviceId).toBeNull();
    expect(state.promptVisible).toBe(false);
  });

  test('clearSessionState resets it but keeps what the device can do', () => {
    const store = configureStore({
      reducer: { auth: authReducer, push: reducer },
      middleware: gDM => gDM({ serializableCheck: false }),
    });
    store.dispatch(sessionEstablished({ id: 'u-1' } as never));
    store.dispatch(permissionChanged('granted'));
    store.dispatch(availabilityChanged('unavailable'));
    store.dispatch(deviceRegistered('dev-1'));

    clearSessionState(store.dispatch);

    expect(store.getState().push).toEqual({ ...initial, availability: 'unavailable' });
  });
});
