import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useCountdown } from './useCountdown';

type AppStateHandler = (state: string) => void;

let appStateHandlers: AppStateHandler[];

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1_000_000);
  appStateHandlers = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _: string,
    handler: AppStateHandler,
  ) => {
    appStateHandlers.push(handler);
    return { remove: jest.fn() };
  }) as never);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useCountdown', () => {
  test('starts at the seconds remaining and ticks down every second', () => {
    const { result } = renderHook(() => useCountdown(1_000_000 + 5_000));
    expect(result.current).toBe(5);

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(4);

    act(() => {
      jest.advanceTimersByTime(4_000);
    });
    expect(result.current).toBe(0);
  });

  test('stays at zero once the target has passed', () => {
    const { result } = renderHook(() => useCountdown(1_000_000 - 1));
    expect(result.current).toBe(0);
    act(() => {
      jest.advanceTimersByTime(3_000);
    });
    expect(result.current).toBe(0);
  });

  test('null yields zero and never ticks', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBe(0);
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(result.current).toBe(0);
  });

  test('recomputes from the clock when the app returns to the foreground', () => {
    const { result } = renderHook(() => useCountdown(1_000_000 + 60_000));
    expect(result.current).toBe(60);

    // Timers are paused in the background: only the wall clock moves.
    jest.setSystemTime(1_000_000 + 45_000);
    act(() => {
      appStateHandlers.forEach(handler => handler('active'));
    });
    expect(result.current).toBe(15);
  });

  test('restarts from a new target', () => {
    const { result, rerender } = renderHook(({ at }: { at: number | null }) => useCountdown(at), {
      initialProps: { at: 1_000_000 + 2_000 },
    });
    expect(result.current).toBe(2);
    rerender({ at: 1_000_000 + 30_000 });
    expect(result.current).toBe(30);
  });
});
