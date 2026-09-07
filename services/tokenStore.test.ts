import { beforeEach, describe, expect, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens } from '@/types';
import { clearTokens, getTokens, setTokens } from './tokenStore';

const tokens: AuthTokens = {
  token: 'access-abc',
  refreshToken: 'refresh-xyz',
  tokenExpires: 1788177686241,
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
});
