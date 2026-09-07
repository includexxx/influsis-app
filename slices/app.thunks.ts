import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThunk } from '@/utils/store';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { ApiError } from '@/services/http';
import { getMe, logout, refresh } from '@/services/auth.service';
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
