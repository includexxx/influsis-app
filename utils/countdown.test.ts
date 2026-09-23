import { describe, expect, test } from '@jest/globals';
import { formatCountdown, parseEpochParam, secondsUntil } from './countdown';

describe('secondsUntil', () => {
  test('rounds up to the next whole second', () => {
    expect(secondsUntil(10_500, 10_000)).toBe(1);
    expect(secondsUntil(12_000, 10_000)).toBe(2);
  });

  test('never goes negative', () => {
    expect(secondsUntil(5_000, 10_000)).toBe(0);
    expect(secondsUntil(10_000, 10_000)).toBe(0);
  });
});

describe('formatCountdown', () => {
  test('renders m:ss with a padded seconds column', () => {
    expect(formatCountdown(299)).toBe('4:59');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(600)).toBe('10:00');
  });

  test('clamps zero and negatives to 0:00', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('parseEpochParam', () => {
  test('reads a numeric string', () => {
    expect(parseEpochParam('1700000000000')).toBe(1_700_000_000_000);
  });

  test('takes the first value of a repeated param', () => {
    expect(parseEpochParam(['1700000000000', '1'])).toBe(1_700_000_000_000);
  });

  test('is null for missing, empty or non-numeric input', () => {
    expect(parseEpochParam(undefined)).toBeNull();
    expect(parseEpochParam('')).toBeNull();
    expect(parseEpochParam('soon')).toBeNull();
  });
});
