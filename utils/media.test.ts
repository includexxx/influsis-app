import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';

const ORIGIN = 'http://192.168.0.10:3001';
const originalEnv = process.env.EXPO_API_ORIGIN;

let resolveMediaUrl: typeof import('./media').resolveMediaUrl;

beforeAll(() => {
  // The origin is read once at module load, so set it before loading media.
  process.env.EXPO_API_ORIGIN = ORIGIN;
  jest.isolateModules(() => {
    ({ resolveMediaUrl } = require('./media'));
  });
});

afterAll(() => {
  if (originalEnv === undefined) delete process.env.EXPO_API_ORIGIN;
  else process.env.EXPO_API_ORIGIN = originalEnv;
});

describe('resolveMediaUrl', () => {
  test('leaves absolute URLs alone', () => {
    expect(resolveMediaUrl('https://cdn.test/a.webp')).toBe('https://cdn.test/a.webp');
    expect(resolveMediaUrl('http://localhost:3001/uploads/a.webp')).toBe(
      'http://localhost:3001/uploads/a.webp',
    );
  });

  test('prefixes a relative path with the API origin', () => {
    expect(resolveMediaUrl('/uploads/campaign-images/a.webp')).toBe(
      `${ORIGIN}/uploads/campaign-images/a.webp`,
    );
  });

  test('returns an empty string for no value', () => {
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
    expect(resolveMediaUrl('')).toBe('');
  });
});
