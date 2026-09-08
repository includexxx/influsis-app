import type { AuthStatus } from '@/slices/auth.slice';

export type GateGroup = '(auth)' | '(main)' | '(details)';

export type GateResult =
  | { type: 'wait' }
  | { type: 'allow' }
  | { type: 'redirect'; href: '/home' | '/onboarding' };

const WAIT: GateResult = { type: 'wait' };
const ALLOW: GateResult = { type: 'allow' };
const TO_HOME: GateResult = { type: 'redirect', href: '/home' };
const TO_ONBOARDING: GateResult = { type: 'redirect', href: '/onboarding' };

/**
 * Pure entry-gate rule table. UX only: the real authorization boundary is the
 * backend (every (main)/(details) call carries the bearer token). `area` is
 * `useSegments()[1]` for the `(auth)` group and is unused for the others.
 */
export function authGate(status: AuthStatus, group: GateGroup, area?: string): GateResult {
  if (status === 'restoring') return WAIT;
  const authed = status === 'authenticated';

  if (group === '(main)' || group === '(details)') {
    return authed ? ALLOW : TO_ONBOARDING;
  }

  // group === '(auth)'
  if (area === 'profile-verification') {
    return authed ? ALLOW : TO_ONBOARDING;
  }
  return authed ? TO_HOME : ALLOW;
}
