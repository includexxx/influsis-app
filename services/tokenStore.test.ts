import { beforeEach, describe, expect, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthAccount, AuthTokens } from '@/types';
import {
  clearStoredAccount,
  clearTokens,
  getStoredAccount,
  getTokens,
  setStoredAccount,
  setTokens,
} from './tokenStore';

const tokens: AuthTokens = {
  token: 'access-abc',
  refreshToken: 'refresh-xyz',
  tokenExpires: 1788177686241,
};

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
  handle: null,
  profile: null,
};

describe('tokenStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('getTokens returns null when nothing is stored', async () => {
    await expect(getTokens()).resolves.toBeNull();
  });

  test('setTokens then getTokens round-trips the whole object', async () => {
    await setTokens(tokens);
    await expect(getTokens()).resolves.toEqual(tokens);
  });

  test('clearTokens removes the stored tokens', async () => {
    await setTokens(tokens);
    await clearTokens();
    await expect(getTokens()).resolves.toBeNull();
  });

  test('getTokens returns null for a corrupt stored value instead of throwing', async () => {
    await AsyncStorage.setItem('TOKENS', 'not-json{');
    await expect(getTokens()).resolves.toBeNull();
  });

  test('getStoredAccount returns null when nothing is stored', async () => {
    await expect(getStoredAccount()).resolves.toBeNull();
  });

  test('setStoredAccount then getStoredAccount round-trips the account', async () => {
    await setStoredAccount(account);
    await expect(getStoredAccount()).resolves.toEqual(account);
  });

  test('clearStoredAccount removes the stored account', async () => {
    await setStoredAccount(account);
    await clearStoredAccount();
    await expect(getStoredAccount()).resolves.toBeNull();
  });

  test('getStoredAccount returns null for a corrupt stored value instead of throwing', async () => {
    await AsyncStorage.setItem('AUTH_ACCOUNT', 'not-json{');
    await expect(getStoredAccount()).resolves.toBeNull();
  });
});
