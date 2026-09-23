import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { secondsUntil } from '@/utils/countdown';

/**
 * Whole seconds until `at` (epoch ms), re-evaluated every second and clamped
 * at zero. Because it counts down to an absolute timestamp rather than from a
 * duration, a backgrounded app (where JS timers are paused) lands on the
 * right value on return - the AppState listener recomputes on `active`.
 *
 * `null` means "nothing to count" and yields `0` without starting a timer.
 * Same effect + cleanup shape as `useHandleAvailability`.
 */
export function useCountdown(at: number | null): number {
  const [remaining, setRemaining] = useState(() => (at === null ? 0 : secondsUntil(at)));

  useEffect(() => {
    if (at === null) {
      setRemaining(0);
      return undefined;
    }

    const recompute = () => setRemaining(secondsUntil(at));
    recompute();

    const interval = setInterval(recompute, 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') recompute();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [at]);

  return remaining;
}
