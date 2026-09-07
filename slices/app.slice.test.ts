import { describe, expect, test } from '@jest/globals';
import { AuthAccount, AuthTokens } from '@/types';
import reducer, {
  deriveUser,
  selectChecked,
  selectLoggedIn,
  sessionAuthenticated,
  sessionEnded,
  sessionLoading,
  setUser,
  type AppState,
} from './app.slice';

const role = {
  key: 'creator',
  displayName: 'Creator',
  description: '',
  isInternal: false,
  requires2fa: false,
  permissionsVersion: 1,
  sortOrder: 20,
};

function account(overrides: Partial<AuthAccount> = {}): AuthAccount {
  return {
    id: 'u1',
    roleKey: 'creator',
    status: 'active',
    role,
    createdAt: '2026-08-31T11:01:25.482Z',
    deactivatedAt: null,
    email: 'a@b.com',
    phone: null,
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    handle: null,
    profile: null,
    ...overrides,
  };
}

const tokens: AuthTokens = {
  token: 'access-abc',
  refreshToken: 'refresh-xyz',
  tokenExpires: 1788177686241,
};

const initial = reducer(undefined, { type: '@@INIT' });

describe('app.slice reducers', () => {
  test('initial state is loading with no session', () => {
    expect(initial).toEqual({
      status: 'loading',
      account: null,
      tokens: null,
      user: undefined,
    });
  });

  test('sessionAuthenticated stores the account, tokens and derived user', () => {
    const next = reducer(
      initial,
      sessionAuthenticated({ account: account({ handle: 'jane' }), tokens }),
    );
    expect(next.status).toBe('authenticated');
    expect(next.account?.id).toBe('u1');
    expect(next.tokens).toEqual(tokens);
    expect(next.user).toEqual({ name: 'jane', email: 'a@b.com' });
  });

  test('sessionEnded clears everything', () => {
    const authed = reducer(initial, sessionAuthenticated({ account: account(), tokens }));
    expect(reducer(authed, sessionEnded())).toEqual({
      status: 'unauthenticated',
      account: null,
      tokens: null,
      user: undefined,
    });
  });

  test('sessionLoading returns to the loading status', () => {
    const authed = reducer(initial, sessionAuthenticated({ account: account(), tokens }));
    expect(reducer(authed, sessionLoading()).status).toBe('loading');
  });

  test('setUser overwrites the compat user field', () => {
    const next = reducer(initial, setUser({ name: 'Edited', email: 'e@x.com' }));
    expect(next.user).toEqual({ name: 'Edited', email: 'e@x.com' });
    expect(reducer(next, setUser(undefined)).user).toBeUndefined();
  });
});

describe('deriveUser', () => {
  test('prefers the handle', () => {
    expect(deriveUser(account({ handle: 'jane', email: 'a@b.com' }))).toEqual({
      name: 'jane',
      email: 'a@b.com',
    });
  });

  test('falls back to the email when there is no handle', () => {
    expect(deriveUser(account({ handle: null, email: 'a@b.com' }))).toEqual({
      name: 'a@b.com',
      email: 'a@b.com',
    });
  });

  test('uses empty strings when both handle and email are null', () => {
    expect(deriveUser(account({ handle: null, email: null }))).toEqual({ name: '', email: '' });
  });

  test('returns undefined for a null account', () => {
    expect(deriveUser(null)).toBeUndefined();
  });
});

describe('selectors', () => {
  const at = (status: AppState['status']): AppState => ({
    status,
    account: null,
    tokens: null,
  });

  test('checked is false only while loading', () => {
    expect(selectChecked(at('loading'))).toBe(false);
    expect(selectChecked(at('authenticated'))).toBe(true);
    expect(selectChecked(at('unauthenticated'))).toBe(true);
  });

  test('loggedIn is true only when authenticated', () => {
    expect(selectLoggedIn(at('loading'))).toBe(false);
    expect(selectLoggedIn(at('authenticated'))).toBe(true);
    expect(selectLoggedIn(at('unauthenticated'))).toBe(false);
  });
});
