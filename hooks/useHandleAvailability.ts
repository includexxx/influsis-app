import { useEffect, useState } from 'react';
import { ApiError, request } from '@/services/http';
import { HandleAvailabilityData } from '@/utils/onboardingSchemas';

export type HandleAvailabilityState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved'
  | 'invalid'
  | 'error';

const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Debounced live check of a creator handle against the one public endpoint
 * this app calls - `GET /api/v1/handles/{handle}/availability` (`skipAuth`).
 * While the format is still invalid the caller passes `enabled: false`, so a
 * half-typed handle never hits the network. After `debounceMs` of no change
 * a request fires; a superseded response (the handle changed, or the
 * component unmounted, before it resolved) is dropped via the effect
 * cleanup's `cancelled` flag. Mirrors `useDebouncedOtherOption`'s
 * effect + timeout + cleanup shape.
 */
export function useHandleAvailability(
  handle: string,
  enabled: boolean,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): { state: HandleAvailabilityState } {
  const [state, setState] = useState<HandleAvailabilityState>('idle');

  useEffect(() => {
    if (!enabled || !handle) {
      setState('idle');
      return undefined;
    }

    let cancelled = false;
    setState('checking');

    const timer = setTimeout(() => {
      request<HandleAvailabilityData>({
        url: `/handles/${encodeURIComponent(handle)}/availability`,
        method: 'GET',
        skipAuth: true,
      })
        .then(data => {
          if (cancelled) return;
          if (data.available) {
            setState('available');
          } else {
            setState(data.reason === 'reserved' ? 'reserved' : 'taken');
          }
        })
        .catch(error => {
          if (cancelled) return;
          setState(error instanceof ApiError && error.statusCode === 422 ? 'invalid' : 'error');
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle, enabled, debounceMs]);

  return { state };
}
