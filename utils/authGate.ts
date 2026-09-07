// Pure route-guard decision shared by the entry screen (app/index.tsx) and the
// (auth) / (main) / (details) `_layout` files. No React or router imports - the
// layouts turn a non-null result into <Redirect href={...} />.
//
// This is UX / defense-in-depth only. The real boundary is the backend
// rejecting unauthenticated requests once product screens call it.

export type AuthArea = 'root' | 'main' | 'details' | 'auth';

interface AuthGateState {
  loggedIn: boolean;
  // Only meaningful for the 'auth' area: the visitor is inside the post-signup
  // profile-verification wizard, where an authenticated session is expected.
  inProfileVerification?: boolean;
}

// 'root' always resolves to a concrete route (the entry screen must go
// somewhere); the guarded groups can return null to mean "render children".
export function authRedirect(area: 'root', state: AuthGateState): '/home' | '/onboarding';
export function authRedirect(
  area: AuthArea,
  state: AuthGateState,
): '/home' | '/onboarding' | null;
export function authRedirect(
  area: AuthArea,
  { loggedIn, inProfileVerification = false }: AuthGateState,
): '/home' | '/onboarding' | null {
  switch (area) {
    case 'root':
      return loggedIn ? '/home' : '/onboarding';
    case 'main':
    case 'details':
      return loggedIn ? null : '/onboarding';
    case 'auth':
      if (loggedIn) return inProfileVerification ? null : '/home';
      return inProfileVerification ? '/onboarding' : null;
  }
}
