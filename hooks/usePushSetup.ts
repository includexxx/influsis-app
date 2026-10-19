import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Dispatch, State } from '@/utils/store';
import { createPushChannels } from '@/services/push/channels';
import { getPushMessaging } from '@/services/push/messaging';
import { syncPushDevice } from '@/services/push/pushThunks';

/**
 * App-start push setup (build-plan 38e1), mounted once in app/_layout.tsx:
 * create the Android channels before any push can arrive, and re-register
 * on every FCM token refresh while signed in. A no-op where push is
 * unavailable (services/push/messaging.ts).
 */
export function usePushSetup(): void {
  const dispatch = useDispatch<Dispatch>();
  const signedIn = useSelector(({ auth }: State) => auth.status === 'authenticated');
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;

  useEffect(() => {
    void createPushChannels();
    const messaging = getPushMessaging();
    if (!messaging) return;
    return messaging.onTokenRefresh(() => {
      if (signedInRef.current) void dispatch(syncPushDevice({ force: true }));
    });
  }, [dispatch]);
}
