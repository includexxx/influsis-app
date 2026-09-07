import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@/services/http';
import * as auth from '@/services/auth.service';
import * as store from '@/services/tokenStore';
import { AuthAccount, AuthTokens } from '@/types';
import app from './app.slice';
import profileVerification from './profileVerification.slice';
import createGig from './createGig.slice';
import { bootstrapSession, signOut } from './app.thunks';

jest.mock('@/services/auth.service');
jest.mock('@/services/tokenStore');

const getTokens = store.getTokens as jest.MockedFunction<typeof store.getTokens>;
const setTokens = store.setTokens as jest.MockedFunction<typeof store.setTokens>;
const clearTokens = store.clearTokens as jest.MockedFunction<typeof store.clearTokens>;
const getStoredAccount = store.getStoredAccount as jest.MockedFunction<
  typeof store.getStoredAccount
>;
const setStoredAccount = store.setStoredAccount as jest.MockedFunction<
  typeof store.setStoredAccount
>;
const clearStoredAccount = store.clearStoredAccount as jest.MockedFunction<
  typeof store.clearStoredAccount
>;
const getMe = auth.getMe as jest.MockedFunction<typeof auth.getMe>;
const refresh = auth.refresh as jest.MockedFunction<typeof auth.refresh>;
const logout = auth.logout as jest.MockedFunction<typeof auth.logout>;

const account: AuthAccount = {
  id: 'u1',
  roleKey: 'creator',
  status: 'active',
  role: {
    key: 'creator',
    displayName: 'Creator',
    description: '',
    isInternal: false,
    requires2fa: false,
    permissionsVersion: 1,
    sortOrder: 20,
  },
  createdAt: '2026-08-31T11:01:25.482Z',
  deactivatedAt: null,
  email: 'a@b.com',
  phone: null,
  emailVerified: true,
  phoneVerified: false,
  twoFactorEnabled: false,
  handle: 'jane',
  profile: null,
};

const fresh: AuthTokens = {
  token: 'a',
  refreshToken: 'r',
  tokenExpires: Date.now() + 3_600_000,
};
const expired: AuthTokens = { token: 'a', refreshToken: 'r', tokenExpires: Date.now() - 1_000 };
const rotated: AuthTokens = {
  token: 'a2',
  refreshToken: 'r2',
  tokenExpires: Date.now() + 3_600_000,
};

const apiError = (code: string) => new ApiError({ code, statusCode: 401, message: code });

function makeStore() {
  return configureStore({ reducer: { app, profileVerification, createGig } });
}

beforeEach(() => {
  jest.clearAllMocks();
  setTokens.mockResolvedValue(undefined);
  clearTokens.mockResolvedValue(undefined);
  setStoredAccount.mockResolvedValue(undefined);
  clearStoredAccount.mockResolvedValue(undefined);
  getStoredAccount.mockResolvedValue(null);
});

describe('bootstrapSession', () => {
  test('ends the session when there are no stored tokens', async () => {
    getTokens.mockResolvedValue(null);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(s.getState().app.status).toBe('unauthenticated');
    expect(getMe).not.toHaveBeenCalled();
  });

  test('authenticates and persists the account with a fresh token', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockResolvedValue(account);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(getMe).toHaveBeenCalledWith('a');
    expect(setStoredAccount).toHaveBeenCalledWith(account);
    expect(s.getState().app).toMatchObject({
      status: 'authenticated',
      account,
      tokens: fresh,
      user: { name: 'jane', email: 'a@b.com' },
    });
  });

  test('refreshes an expired token before fetching the account', async () => {
    getTokens.mockResolvedValue(expired);
    refresh.mockResolvedValue(rotated);
    getMe.mockResolvedValue(account);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(refresh).toHaveBeenCalledWith('r');
    expect(setTokens).toHaveBeenCalledWith(rotated);
    expect(s.getState().app).toMatchObject({ status: 'authenticated', tokens: rotated });
  });

  test('ends the session and clears storage when the refresh token is revoked', async () => {
    getTokens.mockResolvedValue(expired);
    refresh.mockRejectedValue(apiError('AUTH_SESSION_REVOKED'));
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(clearTokens).toHaveBeenCalled();
    expect(clearStoredAccount).toHaveBeenCalled();
    expect(s.getState().app.status).toBe('unauthenticated');
  });

  test('retries once via refresh when the access token is rejected by /auth/me', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockRejectedValueOnce(apiError('AUTH_SESSION_REVOKED')).mockResolvedValueOnce(account);
    refresh.mockResolvedValue(rotated);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(s.getState().app).toMatchObject({ status: 'authenticated', tokens: rotated });
  });

  test('ends the session when the retry refresh also fails', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockRejectedValue(apiError('AUTH_SESSION_REVOKED'));
    refresh.mockRejectedValue(apiError('AUTH_SESSION_REVOKED'));
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(clearTokens).toHaveBeenCalled();
    expect(s.getState().app.status).toBe('unauthenticated');
  });

  test('stays signed in from the stored account on a network error', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockRejectedValue(apiError('NETWORK_ERROR'));
    getStoredAccount.mockResolvedValue(account);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(clearTokens).not.toHaveBeenCalled();
    expect(s.getState().app).toMatchObject({ status: 'authenticated', account });
  });

  test('ends the session on a network error when nothing is stored', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockRejectedValue(apiError('NETWORK_ERROR'));
    getStoredAccount.mockResolvedValue(null);
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(s.getState().app.status).toBe('unauthenticated');
  });

  test('ends the session for a suspended account', async () => {
    getTokens.mockResolvedValue(fresh);
    getMe.mockRejectedValue(apiError('ACCOUNT_SUSPENDED'));
    const s = makeStore();

    await s.dispatch(bootstrapSession());

    expect(clearTokens).toHaveBeenCalled();
    expect(s.getState().app.status).toBe('unauthenticated');
  });
});

describe('signOut', () => {
  test('calls logout, clears all three keys and ends the session', async () => {
    getTokens.mockResolvedValue(fresh);
    logout.mockResolvedValue(undefined);
    await AsyncStorage.setItem('USER', JSON.stringify({ name: 'x', email: 'y' }));
    const s = makeStore();
    s.dispatch({ type: 'app/sessionAuthenticated', payload: { account, tokens: fresh } });

    await s.dispatch(signOut());

    expect(logout).toHaveBeenCalledWith('a');
    expect(clearTokens).toHaveBeenCalled();
    expect(clearStoredAccount).toHaveBeenCalled();
    await expect(AsyncStorage.getItem('USER')).resolves.toBeNull();
    expect(s.getState().app.status).toBe('unauthenticated');
  });

  test('still tears down locally when the logout request fails', async () => {
    getTokens.mockResolvedValue(fresh);
    logout.mockRejectedValue(apiError('AUTH_SESSION_REVOKED'));
    const s = makeStore();

    await s.dispatch(signOut());

    expect(clearTokens).toHaveBeenCalled();
    expect(s.getState().app.status).toBe('unauthenticated');
  });

  test('skips the logout call when there is no token', async () => {
    getTokens.mockResolvedValue(null);
    const s = makeStore();

    await s.dispatch(signOut());

    expect(logout).not.toHaveBeenCalled();
    expect(s.getState().app.status).toBe('unauthenticated');
  });
});
