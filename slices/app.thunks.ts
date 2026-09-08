import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThunk } from '@/utils/store';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { ApiError } from '@/services/http';
import { getMe, login, logout, refresh, register } from '@/services/auth.service';
import { authErrorFieldErrors, authErrorMessage } from '@/utils/authError';
import {
  clearStoredAccount,
  clearTokens,
  getStoredAccount,
  getTokens,
  setStoredAccount,
  setTokens,
} from '@/services/tokenStore';
import { AuthTokens } from '@/types';
import { sessionAuthenticated, sessionEnded } from './app.slice';

// Refresh an access token this close to (or past) its expiry rather than
// letting the first real request 401.
const REFRESH_SKEW_MS = 30_000;

const ACCOUNT_BLOCKED = new Set(['ACCOUNT_SUSPENDED', 'ACCOUNT_DEACTIVATED']);

async function endSessionStorage(): Promise<void> {
  await clearTokens();
  await clearStoredAccount();
}

async function refreshAndFetch(refreshToken: string) {
  const tokens = await refresh(refreshToken);
  await setTokens(tokens);
  const account = await getMe(tokens.token);
  await setStoredAccount(account);
  return { account, tokens };
}

// Shared tail of signIn / signUp: exchange a fresh token pair for the full
// AuthAccount, persist both, and hand the pair to sessionAuthenticated. Mirrors
// refreshAndFetch - login returns only a reduced LoginAccount, so getMe always
// runs before the slice sees an account.
async function fetchAndPersist(tokens: AuthTokens) {
  const account = await getMe(tokens.token);
  await setTokens(tokens);
  await setStoredAccount(account);
  return { account, tokens };
}

export type AuthResult =
  | { status: 'ok' }
  | { status: 'mfa-unsupported' }
  | { status: 'error'; message: string; fieldErrors: Record<string, string> };

function toErrorResult(err: unknown): Extract<AuthResult, { status: 'error' }> {
  const apiError =
    err instanceof ApiError
      ? err
      : new ApiError({ code: 'UNKNOWN', statusCode: 0, message: 'Unknown error' });
  return {
    status: 'error',
    message: authErrorMessage(apiError),
    fieldErrors: authErrorFieldErrors(apiError),
  };
}

function isAuthDead(err: unknown): boolean {
  return err instanceof ApiError && (err.code.startsWith('AUTH_') || ACCOUNT_BLOCKED.has(err.code));
}

// Runs once on launch. Always resolves - app/_layout hides the splash on
// resolve, so a rejection would leave it up forever.
export function bootstrapSession(): AppThunk<Promise<void>> {
  return async dispatch => {
    const optimistic = async (tokens: AuthTokens) => {
      const stored = await getStoredAccount();
      dispatch(stored ? sessionAuthenticated({ account: stored, tokens }) : sessionEnded());
    };

    try {
      const tokens = await getTokens();
      if (!tokens) {
        dispatch(sessionEnded());
        return;
      }

      if (Date.now() >= tokens.tokenExpires - REFRESH_SKEW_MS) {
        try {
          dispatch(sessionAuthenticated(await refreshAndFetch(tokens.refreshToken)));
        } catch (err) {
          if (isAuthDead(err)) {
            await endSessionStorage();
            dispatch(sessionEnded());
          } else {
            await optimistic(tokens);
          }
        }
        return;
      }

      try {
        const account = await getMe(tokens.token);
        await setStoredAccount(account);
        dispatch(sessionAuthenticated({ account, tokens }));
      } catch (err) {
        if (err instanceof ApiError && err.code.startsWith('AUTH_')) {
          try {
            dispatch(sessionAuthenticated(await refreshAndFetch(tokens.refreshToken)));
          } catch {
            await endSessionStorage();
            dispatch(sessionEnded());
          }
        } else if (err instanceof ApiError && ACCOUNT_BLOCKED.has(err.code)) {
          await endSessionStorage();
          dispatch(sessionEnded());
        } else {
          await optimistic(tokens);
        }
      }
    } catch {
      dispatch(sessionEnded());
    }
  };
}

// Sign In. Never throws - the scene renders the returned result. The
// login -> getMe -> persist -> dispatch sequence mirrors bootstrapSession.
export function signIn(input: {
  identifier: string;
  password: string;
}): AppThunk<Promise<AuthResult>> {
  return async dispatch => {
    try {
      const result = await login(input);
      if (result.status === 'mfa') return { status: 'mfa-unsupported' };

      dispatch(sessionAuthenticated(await fetchAndPersist(result.tokens)));
      return { status: 'ok' };
    } catch (err) {
      return toErrorResult(err);
    }
  };
}

// Sign Up: register a creator, then log the new account straight in. A
// just-created creator has no 2FA, so the 'mfa' branch is defensive only.
export function signUp(input: {
  email: string;
  phone?: string;
  password: string;
}): AppThunk<Promise<AuthResult>> {
  return async dispatch => {
    try {
      const email = input.email.trim();
      const regs = await register({ roleKey: 'creator', email, password: input.password });
      console.log({ regs });
      const result = await login({ identifier: email, password: input.password });
      console.log({ result });

      if (result.status === 'mfa') {
        return {
          status: 'error',
          message:
            'This account needs two-factor authentication, which the app does not support yet.',
          fieldErrors: {},
        };
      }

      dispatch(sessionAuthenticated(await fetchAndPersist(result.tokens)));
      return { status: 'ok' };
    } catch (err) {
      return toErrorResult(err);
    }
  };
}

export function signOut(): AppThunk<Promise<void>> {
  return async dispatch => {
    const tokens = await getTokens();
    if (tokens) {
      try {
        await logout(tokens.token);
      } catch {
        // already revoked or offline - tear down locally anyway
      }
    }
    await Promise.all([
      clearTokens(),
      clearStoredAccount(),
      AsyncStorage.removeItem(DataPersistKeys.USER),
    ]);
    dispatch(sessionEnded());
  };
}
