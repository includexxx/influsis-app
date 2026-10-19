import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';

// Push on this device (build-plan 38e1). `permission` mirrors the OS:
// `unknown` = not asked yet (or not knowable on Android before asking),
// `blocked` = Android's "don't ask again" (only the OS settings can undo it).
export type PushPermission = 'unknown' | 'granted' | 'provisional' | 'denied' | 'blocked';
export type PushAvailability = 'unknown' | 'available' | 'unavailable';

export interface PushState {
  permission: PushPermission;
  /** `unavailable`: no push in this build, or getToken() failed (no Play Services, simulator). */
  availability: PushAvailability;
  /** NT7's id for this device's registration. */
  deviceId: string | null;
  /** The permission explainer is open. */
  promptVisible: boolean;
}

const initialState: PushState = {
  permission: 'unknown',
  availability: 'unknown',
  deviceId: null,
  promptVisible: false,
};

const slice = createSlice({
  name: 'push',
  initialState,
  reducers: {
    permissionChanged: (state, { payload }: PayloadAction<PushPermission>) => {
      state.permission = payload;
    },
    availabilityChanged: (state, { payload }: PayloadAction<PushAvailability>) => {
      state.availability = payload;
    },
    deviceRegistered: (state, { payload }: PayloadAction<string>) => {
      state.deviceId = payload;
    },
    deviceCleared: state => {
      state.deviceId = null;
    },
    promptShown: state => {
      state.promptVisible = true;
    },
    promptClosed: state => {
      state.promptVisible = false;
    },
    // Whether this device can do push doesn't change with who is signed in.
    reset: state => ({ ...initialState, availability: state.availability }),
  },
});

export const {
  permissionChanged,
  availabilityChanged,
  deviceRegistered,
  deviceCleared,
  promptShown,
  promptClosed,
  reset,
} = slice.actions;

export function usePushSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ push }: State) => push);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
