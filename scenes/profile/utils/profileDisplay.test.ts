import { describe, expect, test } from '@jest/globals';
import {
  capitalize,
  formatMonthYear,
  labelFor,
  socialPlatformLabel,
  socialProfileUrl,
} from './profileDisplay';

describe('labelFor', () => {
  test('maps a stored value to its label, capitalizing unknown free text', () => {
    const options = [{ value: 'english', label: 'English' }];
    expect(labelFor('english', options)).toBe('English');
    expect(labelFor('klingon', options)).toBe('Klingon');
  });
});

describe('capitalize', () => {
  test('uppercases the first letter', () => {
    expect(capitalize('bangladesh')).toBe('Bangladesh');
  });
});

describe('socialProfileUrl', () => {
  test('builds a profile URL per platform, stripping a leading @', () => {
    expect(socialProfileUrl('instagram', 'ayesha')).toBe('https://instagram.com/ayesha');
    expect(socialProfileUrl('tiktok', '@ayesha')).toBe('https://tiktok.com/@ayesha');
    expect(socialProfileUrl('youtube', 'ayesha')).toBe('https://youtube.com/@ayesha');
    expect(socialProfileUrl('facebook', 'ayesha')).toBe('https://facebook.com/ayesha');
  });

  test('returns null without a handle or for an unknown platform', () => {
    expect(socialProfileUrl('instagram', null)).toBeNull();
    expect(socialProfileUrl('instagram', '  ')).toBeNull();
    expect(socialProfileUrl('myspace', 'ayesha')).toBeNull();
  });
});

describe('socialPlatformLabel', () => {
  test('uses the brand spelling, capitalizing unknown platforms', () => {
    expect(socialPlatformLabel('youtube')).toBe('YouTube');
    expect(socialPlatformLabel('tiktok')).toBe('TikTok');
    expect(socialPlatformLabel('threads')).toBe('Threads');
  });
});

describe('formatMonthYear', () => {
  test('renders month and year', () => {
    expect(formatMonthYear('2026-08-13T12:00:00.000Z')).toBe('Aug 2026');
  });

  test('falls back to a dash for missing or invalid input', () => {
    expect(formatMonthYear(null)).toBe('—');
    expect(formatMonthYear('nope')).toBe('—');
  });
});
