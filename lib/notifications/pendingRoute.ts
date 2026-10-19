// A notification opened before the session is restored, or while signed out
// (an email link in 38d, a push tap in 38e), keeps its path here until the
// creator is signed in; app/(main)/_layout.tsx then opens it
// (CLIENT_INTEGRATION §4). In memory only, and deliberately not cleared on
// sign-out: a link tapped while signed out must survive until sign-in.

let pending: string | null = null;

/** Holds `path` for after sign-in. The last hold wins. */
export function holdNotificationRoute(path: string): void {
  pending = path;
}

/** Returns the held path (if any) and clears it. */
export function takeNotificationRoute(): string | null {
  const path = pending;
  pending = null;
  return path;
}
