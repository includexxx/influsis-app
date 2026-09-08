import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { AuthTokens } from '@/types';

const KEY = DataPersistKeys.TOKENS;

// Synchronous mirror of the persisted pair so the request interceptor can read
// the access token without awaiting AsyncStorage on every call. Seeded on the
// first getTokens(), kept in sync by setTokens()/clearTokens().
let memoryTokens: AuthTokens | null = null;

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.token === 'string' &&
    typeof t.refreshToken === 'string' &&
    typeof t.tokenExpires === 'number'
  );
}

export async function getTokens(): Promise<AuthTokens | null> {
  if (memoryTokens) return memoryTokens;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAuthTokens(parsed)) return null;
    memoryTokens = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  memoryTokens = tokens;
  await AsyncStorage.setItem(KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  memoryTokens = null;
  await AsyncStorage.removeItem(KEY);
}

/** Access token from the in-memory mirror, or null. Never touches storage. */
export function peekAccessToken(): string | null {
  return memoryTokens?.token ?? null;
}
