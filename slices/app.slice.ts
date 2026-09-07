import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { AuthAccount, AuthTokens } from '@/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionUser {
  name: string;
  email: string;
}

export interface AppState {
  status: SessionStatus;
  account: AuthAccount | null;
  tokens: AuthTokens | null;
  // Compat field for Profile / EditProfile until feature 21 wires them to
  // GET /profiles/me. GET /auth/me has no display name, so this stands in the
  // handle (or email).
  user?: SessionUser;
}

export function deriveUser(account: AuthAccount | null): SessionUser | undefined {
  if (!account) return undefined;
  return {
    name: account.handle ?? account.email ?? '',
    email: account.email ?? '',
  };
}

const initialState: AppState = {
  status: 'loading',
  account: null,
  tokens: null,
  user: undefined,
};

const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    sessionLoading: state => {
      state.status = 'loading';
    },
    sessionAuthenticated: (
      state,
      { payload }: PayloadAction<{ account: AuthAccount; tokens: AuthTokens }>,
    ) => {
      state.status = 'authenticated';
      state.account = payload.account;
      state.tokens = payload.tokens;
      state.user = deriveUser(payload.account);
    },
    sessionEnded: state => {
      state.status = 'unauthenticated';
      state.account = null;
      state.tokens = null;
      state.user = undefined;
    },
    setUser: (state, { payload }: PayloadAction<SessionUser | undefined>) => {
      state.user = payload;
    },
  },
});

export const { sessionLoading, sessionAuthenticated, sessionEnded, setUser } = slice.actions;

// `checked` = the launch rehydrate has finished (splash can lift);
// `loggedIn` = there is a live session.
export const selectChecked = (state: AppState) => state.status !== 'loading';
export const selectLoggedIn = (state: AppState) => state.status === 'authenticated';

export function useAppSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ app }: State) => app);
  return {
    dispatch,
    ...state,
    ...slice.actions,
    checked: selectChecked(state),
    loggedIn: selectLoggedIn(state),
  };
}

export default slice.reducer;
