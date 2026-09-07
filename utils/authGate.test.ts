import { describe, expect, test } from '@jest/globals';
import { authRedirect } from './authGate';

describe('authRedirect', () => {
  describe('root', () => {
    test('authenticated -> /home', () => {
      expect(authRedirect('root', { loggedIn: true })).toBe('/home');
    });
    test('unauthenticated -> /onboarding', () => {
      expect(authRedirect('root', { loggedIn: false })).toBe('/onboarding');
    });
  });

  describe('main / details', () => {
    test('authenticated renders (null) for both areas', () => {
      expect(authRedirect('main', { loggedIn: true })).toBeNull();
      expect(authRedirect('details', { loggedIn: true })).toBeNull();
    });
    test('unauthenticated -> /onboarding for both areas', () => {
      expect(authRedirect('main', { loggedIn: false })).toBe('/onboarding');
      expect(authRedirect('details', { loggedIn: false })).toBe('/onboarding');
    });
  });

  describe('auth', () => {
    test('authenticated outside the wizard -> /home', () => {
      expect(authRedirect('auth', { loggedIn: true, inProfileVerification: false })).toBe('/home');
    });
    test('authenticated inside the wizard renders (null)', () => {
      expect(authRedirect('auth', { loggedIn: true, inProfileVerification: true })).toBeNull();
    });
    test('unauthenticated inside the wizard -> /onboarding', () => {
      expect(authRedirect('auth', { loggedIn: false, inProfileVerification: true })).toBe(
        '/onboarding',
      );
    });
    test('unauthenticated outside the wizard renders (null)', () => {
      expect(authRedirect('auth', { loggedIn: false, inProfileVerification: false })).toBeNull();
    });
    test('omitted inProfileVerification matches the false case', () => {
      expect(authRedirect('auth', { loggedIn: true })).toBe('/home');
      expect(authRedirect('auth', { loggedIn: false })).toBeNull();
    });
  });
});
