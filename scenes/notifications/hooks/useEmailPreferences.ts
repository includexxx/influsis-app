import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/services/notificationsApi';
import { diffEmail, EmailToggle, emailMap, emailToggles } from '../utils/emailPreferences';

export const EMAIL_SAVE_ERROR = "Couldn't save your email settings. Try again.";

export interface UseEmailPreferencesResult {
  /** NT5's categories with the on-screen (optimistic) values. */
  toggles: EmailToggle[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  isSaving: boolean;
  saveError: string | null;
  toggle: (category: string) => void;
}

// Email toggles (NT5 / NT6, build-plan 38c). A toggle shows at once; saving
// is serialized: one NT6 at a time, and when it settles the hook sends
// whatever still differs between the screen and the server, so rapid taps
// end on the last state and overlapping requests can never land out of
// order. A failure puts the screen back on the server's values.
export function useEmailPreferences({ skip }: { skip: boolean }): UseEmailPreferencesResult {
  const { data, isLoading, isError, refetch } = useGetNotificationPreferencesQuery(undefined, {
    skip,
  });
  const [update] = useUpdateNotificationPreferencesMutation();

  // Refs are the source of truth while saving; `desired` state mirrors the
  // ref for rendering.
  const confirmedRef = useRef<Record<string, boolean>>({});
  const desiredRef = useRef<Record<string, boolean>>({});
  const inFlight = useRef(false);
  const [desired, setDesired] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setDesiredBoth = useCallback((next: Record<string, boolean>) => {
    desiredRef.current = next;
    setDesired(next);
  }, []);

  // A (re)load from the server, outside a save, is the new baseline.
  useEffect(() => {
    if (!data || inFlight.current) return;
    confirmedRef.current = emailMap(data);
    setDesiredBoth(emailMap(data));
  }, [data, setDesiredBoth]);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSaving(true);
    try {
      for (;;) {
        const email = diffEmail(desiredRef.current, confirmedRef.current);
        if (!email) break;
        try {
          confirmedRef.current = emailMap(await update({ email }).unwrap());
        } catch (err) {
          setDesiredBoth({ ...confirmedRef.current });
          const e = err as { statusCode?: number; message?: string };
          setSaveError(e?.statusCode === 422 && e.message ? e.message : EMAIL_SAVE_ERROR);
          break;
        }
      }
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  }, [update, setDesiredBoth]);

  const toggle = useCallback(
    (category: string) => {
      if (!(category in desiredRef.current)) return;
      setSaveError(null);
      setDesiredBoth({ ...desiredRef.current, [category]: !desiredRef.current[category] });
      void flush();
    },
    [flush, setDesiredBoth],
  );

  const toggles = useMemo(
    () =>
      data
        ? emailToggles(data).map(t => ({ ...t, enabled: desired[t.category] ?? t.enabled }))
        : [],
    [data, desired],
  );

  return {
    toggles,
    isLoading,
    isError,
    retry: refetch,
    isSaving,
    saveError,
    toggle,
  };
}
