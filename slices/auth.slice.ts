import { useDispatch, useSelector } from 'react-redux';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { authApi, clearTokens, getTokens, ApiError } from '@/services';
import { AuthAccount } from '@/types';

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
 * Explicit user logout. Ends the Redux session and drops cached authApi data
 * synchronously (so a caller can navigate immediately against a consistent
 * `unauthenticated` status), then wipes the stored token pair. A later leaf
 * adds `POST /auth/logout` before `clearTokens()`.
 */
export const signOut = createAsyncThunk<void, void>('auth/signOut', async (_, { dispatch }) => {
  dispatch(sessionEnded());
  dispatch(authApi.util.resetApiState());
  await clearTokens();
});

export function useAuthSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ auth }: State) => auth);
  return { dispatch, ...state, ...slice.actions, restoreSession, signOut };
}

export default slice.reducer;
