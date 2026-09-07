import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { AuthTokens } from '@/types';

// A service-layer wrapper so non-component callers (app bootstrap, the future
// refresh flow) do not touch AsyncStorage directly. Components still go through
// useDataPersist.
export async function getTokens(): Promise<AuthTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(DataPersistKeys.TOKENS);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setItem(DataPersistKeys.TOKENS, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(DataPersistKeys.TOKENS);
}
