import { describe, expect, jest, test } from '@jest/globals';
import { resolveMediaKeyOrUrl, resolveMediaUrl } from './media';

jest.mock('./config', () => ({
  __esModule: true,
  default: { apiUrl: 'http://192.168.0.10:3001/api/v1' },
}));

describe('resolveMediaUrl', () => {
  test('rewrites a localhost origin onto the API host', () => {
    expect(resolveMediaUrl('http://localhost:3001/uploads/a.webp')).toBe(
      'http://192.168.0.10:3001/uploads/a.webp',
    );
  });

  test('leaves other URLs alone', () => {
    expect(resolveMediaUrl('https://cdn.test/a.webp')).toBe('https://cdn.test/a.webp');
  });
});

describe('resolveMediaKeyOrUrl', () => {
  test('serves a bare storage key from the API host upload path', () => {
    expect(resolveMediaKeyOrUrl('campaign-images/a.webp')).toBe(
      'http://192.168.0.10:3001/uploads/campaign-images/a.webp',
    );
    expect(resolveMediaKeyOrUrl('/campaign-images/a.webp')).toBe(
      'http://192.168.0.10:3001/uploads/campaign-images/a.webp',
    );
  });

  test('treats absolute URLs like resolveMediaUrl', () => {
    expect(resolveMediaKeyOrUrl('http://127.0.0.1:3001/uploads/a.webp')).toBe(
      'http://192.168.0.10:3001/uploads/a.webp',
    );
    expect(resolveMediaKeyOrUrl('https://cdn.test/a.webp')).toBe('https://cdn.test/a.webp');
  });

  test('returns null for no value', () => {
    expect(resolveMediaKeyOrUrl(null)).toBeNull();
    expect(resolveMediaKeyOrUrl('')).toBeNull();
  });
});
