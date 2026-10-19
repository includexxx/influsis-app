import { createListenerMiddleware } from '@reduxjs/toolkit';
import { restoreSession, sessionEstablished } from '@/slices/auth.slice';
import { syncPushDevice } from './pushThunks';

// When to register this device (build-plan 38e1, backend NT7):
// - every sign-in (password, OTP, 2FA, social) is a new backend session the
//   device must be bound to, so it always registers;
// - a launch that restores the session registers at most once a day.
// Token refreshes are handled in hooks/usePushSetup.ts.
const pushListener = createListenerMiddleware();

pushListener.startListening({
  actionCreator: sessionEstablished,
  effect: (_action, { dispatch }) => {
    void dispatch(syncPushDevice({ force: true }));
  },
});

pushListener.startListening({
  actionCreator: restoreSession.fulfilled,
  effect: (action, { dispatch }) => {
    if (action.payload) void dispatch(syncPushDevice({ force: false }));
  },
});

export default pushListener;
