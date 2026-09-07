import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { AuthAccount, AuthTokens } from '@/types';

// Service-layer wrappers so non-component callers (app bootstrap, the session
// thunks) do not touch AsyncStorage directly. Components still go through
// useDataPersist. A malformed stored value reads back as null, never throws.
async function readJson<T>(key: DataPersistKeys): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function getTokens(): Promise<AuthTokens | null> {
  return readJson<AuthTokens>(DataPersistKeys.TOKENS);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setItem(DataPersistKeys.TOKENS, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(DataPersistKeys.TOKENS);
}

export async function getStoredAccount(): Promise<AuthAccount | null> {
  return readJson<AuthAccount>(DataPersistKeys.AUTH_ACCOUNT);
}

export async function setStoredAccount(account: AuthAccount): Promise<void> {
  await AsyncStorage.setItem(DataPersistKeys.AUTH_ACCOUNT, JSON.stringify(account));
}

export async function clearStoredAccount(): Promise<void> {
  await AsyncStorage.removeItem(DataPersistKeys.AUTH_ACCOUNT);
}
