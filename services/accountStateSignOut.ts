import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { ApiErrorCode } from '@/types';
import { signOut } from '@/slices/auth.slice';
import { notificationsApi } from './notificationsApi';

// An account the backend no longer serves answers 403 with one of these codes.
// That is not a 401, so services/http.ts' refresh path never sees it; the
// notification calls sign out here instead, the same way a revoked session
// does (AUTH_SESSION_REVOKED is a 401 and already signs out through the dead
// refresh). Backend 24 contract checks, build-plan item 38.
export const SIGN_OUT_ACCOUNT_CODES: readonly ApiErrorCode[] = [
  'ACCOUNT_SUSPENDED',
  'ACCOUNT_DEACTIVATED',
  'ACCOUNT_PENDING_VERIFICATION',
];

const accountStateSignOut = createListenerMiddleware();

accountStateSignOut.startListening({
  matcher: isAnyOf(
    notificationsApi.endpoints.getNotificationsPage.matchRejected,
    notificationsApi.endpoints.getUnreadCount.matchRejected,
    notificationsApi.endpoints.markNotificationRead.matchRejected,
    notificationsApi.endpoints.markAllNotificationsRead.matchRejected,
  ),
  effect: (action, { dispatch }) => {
    const code = (action.payload as { code?: unknown } | undefined)?.code;
    if (typeof code === 'string' && SIGN_OUT_ACCOUNT_CODES.includes(code as ApiErrorCode)) {
      dispatch(signOut());
    }
  },
});

export default accountStateSignOut;
