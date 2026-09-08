import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens } from '@/types';
import { clearTokens, getTokens, peekAccessToken, setTokens } from './tokenStore';

const sample: AuthTokens = {
  token: 'access-abc',
  refreshToken: 'refresh-xyz',
  tokenExpires: 1_800_000_000_000,
};

describe('tokenStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await clearTokens();
    jest.clearAllMocks();
  });

  test('set then get round trips the pair', async () => {
    await setTokens(sample);
    await expect(getTokens()).resolves.toEqual(sample);
  });

  test('clearTokens removes the key and nulls the mirror', async () => {
    await setTokens(sample);
    await clearTokens();
    expect(await AsyncStorage.getItem('TOKENS')).toBeNull();
    expect(peekAccessToken()).toBeNull();
    await expect(getTokens()).resolves.toBeNull();
  });

  test('a corrupt stored value resolves to null', async () => {
    await AsyncStorage.setItem('TOKENS', 'not-json{');
    await expect(getTokens()).resolves.toBeNull();
  });

  test('a structurally invalid stored value resolves to null', async () => {
    await AsyncStorage.setItem('TOKENS', JSON.stringify({ token: 1 }));
    await expect(getTokens()).resolves.toBeNull();
  });

  test('peekAccessToken reads the mirror without a storage read', async () => {
    await setTokens(sample);
    const getItem = jest.spyOn(AsyncStorage, 'getItem');
    expect(peekAccessToken()).toBe('access-abc');
    expect(getItem).not.toHaveBeenCalled();
  });
});
