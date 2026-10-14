import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { authApi, clearTokens, getTokens, ApiError } from '@/services';
import { profilesApi } from '@/services/profilesApi';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { businessDirectoryApi } from '@/scenes/business/api/businessDirectoryApi';
import { creatorDirectoryApi } from '@/scenes/creator/api/creatorDirectoryApi';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { clearPendingPreAuthToken } from '@/utils/preAuthToken';
import { clearPendingResetToken } from '@/utils/resetToken';
import { AuthAccount } from '@/types';
import { reset as resetApp } from './app.slice';
import { reset as resetCreatorOnboarding } from './creatorOnboarding.slice';
import { reset as resetCreateGig } from './createGig.slice';

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  account: AuthAccount | null;
}

const initialState: AuthState = {
  status: 'restoring',
  account: null,
};

/**
 * Launch rehydrate. Reads the token store, then confirms the session with
 * GET /auth/me (the 19a interceptor refreshes a stale access token in flight).
 * Never rejects: returns the account on success, null on any failure, and
 * clears the token store only on a definitive 401/403.
 */
export const restoreSession = createAsyncThunk<AuthAccount | null, void>(
  'auth/restoreSession',
  async (_, { dispatch }) => {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return null;
    const req = dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
    try {
      return await req.unwrap();
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        await clearTokens();
      }
      return null;
    } finally {
      req.unsubscribe();
    }
  },
);

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEstablished: (state: AuthState, { payload }: PayloadAction<AuthAccount>) => {
      state.status = 'authenticated';
      state.account = payload;
    },
    sessionEnded: (state: AuthState) => {
      state.status = 'unauthenticated';
      state.account = null;
    },
    accountUpdated: (state: AuthState, { payload }: PayloadAction<AuthAccount>) => {
      state.account = payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.status = payload ? 'authenticated' : 'unauthenticated';
        state.account = payload;
      })
      .addCase(restoreSession.rejected, state => {
        state.status = 'unauthenticated';
        state.account = null;
      });
  },
});

export const { sessionEstablished, sessionEnded, accountUpdated } = slice.actions;

/**
 * Synchronous in-memory wipe shared by every sign-out path (explicit logout
 * and the dead-refresh handler in `utils/store.ts`): ends the session, resets
 * every user-scoped slice back to its initial state, drops every RTK Query
 * cache, and forgets any half-finished MFA / password-reset token.
 */
export function clearSessionState(dispatch: ThunkDispatch<unknown, unknown, UnknownAction>) {
  dispatch(sessionEnded());
  dispatch(resetApp());
  dispatch(resetCreatorOnboarding());
  dispatch(resetCreateGig());
  dispatch(authApi.util.resetApiState());
  dispatch(profilesApi.util.resetApiState());
  dispatch(campaignFeedApi.util.resetApiState());
  dispatch(businessDirectoryApi.util.resetApiState());
  dispatch(creatorDirectoryApi.util.resetApiState());
  clearPendingPreAuthToken();
  clearPendingResetToken();
}

/**
 * Explicit user logout. Clears all in-memory state synchronously (so a caller
 * can navigate immediately against a consistent `unauthenticated` status),
 * then wipes the token pair (and its in-memory mirror) and every other
 * persisted key. A later leaf adds `POST /auth/logout` before `clearTokens()`.
 */
export const signOut = createAsyncThunk<void, void>('auth/signOut', async (_, { dispatch }) => {
  clearSessionState(dispatch);
  await clearTokens();
  await AsyncStorage.multiRemove(Object.values(DataPersistKeys));
});

export function useAuthSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ auth }: State) => auth);
  return { dispatch, ...state, ...slice.actions, restoreSession, signOut };
}

export default slice.reducer;
