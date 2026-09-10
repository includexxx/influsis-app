import { describe, expect, test } from '@jest/globals';
import {
  PORTFOLIO_PLATFORM_OPTIONS,
  detectPlatform,
  isLikelyPortfolioUrl,
  normalizePortfolioUrl,
} from './portfolioPlatforms';

describe('portfolioPlatforms', () => {
  test('exposes the four platform options', () => {
    expect(PORTFOLIO_PLATFORM_OPTIONS.map(o => o.value)).toEqual([
      'instagram',
      'youtube',
      'tiktok',
      'others',
    ]);
  });

  describe('detectPlatform', () => {
    test('maps a host to its platform', () => {
      expect(detectPlatform('https://www.instagram.com/p/abc/')).toBe('instagram');
      expect(detectPlatform('https://youtube.com/watch?v=abc')).toBe('youtube');
      expect(detectPlatform('https://youtu.be/abc')).toBe('youtube');
      expect(detectPlatform('https://www.tiktok.com/@me/video/1')).toBe('tiktok');
    });

    test('falls back to others for an unknown host', () => {
      expect(detectPlatform('https://example.com/post')).toBe('others');
      expect(detectPlatform('')).toBe('others');
    });
  });

  describe('isLikelyPortfolioUrl', () => {
    test('accepts bare-host and https links', () => {
      expect(isLikelyPortfolioUrl('instagram.com/p/abc')).toBe(true);
      expect(isLikelyPortfolioUrl('https://youtu.be/abc')).toBe(true);
      expect(isLikelyPortfolioUrl('  tiktok.com/@x/video/1  ')).toBe(true);
    });

    test('rejects empty and free text', () => {
      expect(isLikelyPortfolioUrl('')).toBe(false);
      expect(isLikelyPortfolioUrl('not a link')).toBe(false);
      expect(isLikelyPortfolioUrl('hello')).toBe(false);
    });
  });

  test('normalizePortfolioUrl strips scheme, trailing slash, and case', () => {
    expect(normalizePortfolioUrl('HTTPS://Instagram.com/P/ABC/')).toBe('instagram.com/p/abc');
    expect(normalizePortfolioUrl('  instagram.com/p/abc  ')).toBe('instagram.com/p/abc');
  });
});
