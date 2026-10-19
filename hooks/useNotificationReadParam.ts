import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { router, useGlobalSearchParams } from 'expo-router';
import type { Dispatch, State } from '@/utils/store';
import { useMarkNotificationReadMutation } from '@/services/notificationsApi';
import { markedReadLocally, markReadReverted } from '@/slices/notificationsLive.slice';

/**
 * `?n={notificationId}` on any screen (email links, backend
 * CLIENT_INTEGRATION §6; build-plan 38d1): once signed in, mark that
 * notification read (NT3, shown at once through the live slice) and drop `n`
 * from the URL. Any failure only reverts the local mark - a 404 is expected
 * for another account's link or a notification retention already deleted.
 * Mounted once in app/_layout.tsx.
 */
export function useNotificationReadParam(): void {
  const params = useGlobalSearchParams<{ n?: string | string[] }>();
  const raw = Array.isArray(params.n) ? params.n[0] : params.n;
  const id = typeof raw === 'string' && raw.length > 0 ? raw : null;
  const signedIn = useSelector(({ auth }: State) => auth.status === 'authenticated');
  const dispatch = useDispatch<Dispatch>();
  const [markRead] = useMarkNotificationReadMutation();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!signedIn || !id || handled.current.has(id)) return;
    handled.current.add(id);
    dispatch(markedReadLocally(id));
    markRead({ id })
      .unwrap()
      .catch(() => dispatch(markReadReverted(id)));
    // query-string leaves undefined values out, so this removes `n` from the URL.
    router.setParams({ n: undefined });
  }, [signedIn, id, dispatch, markRead]);
}
