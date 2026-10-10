import { describe, expect, test } from '@jest/globals';

import {
  isCustomItem,
  LEGACY_PAIRS,
  OBJECTIVE_OPTIONS,
  objectiveLabel,
  objectiveOptionLabel,
} from './objectives';

const pairKey = (item: { platform: string; type: string }) => `${item.platform}:${item.type}`;

describe('OBJECTIVE_OPTIONS', () => {
  test('mirrors the backend seed: 7 UGC and 10 Brand Awareness pairs, none repeated', () => {
    expect(OBJECTIVE_OPTIONS.ugc_content).toHaveLength(7);
    expect(OBJECTIVE_OPTIONS.brand_awareness).toHaveLength(10);
    for (const list of Object.values(OBJECTIVE_OPTIONS)) {
      const keys = list.map(pairKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  test('offers no retired ugc pair, no custom pair and no YouTube Story', () => {
    const all = [...OBJECTIVE_OPTIONS.ugc_content, ...OBJECTIVE_OPTIONS.brand_awareness];
    expect(all.some(item => item.platform === 'ugc' || item.platform === 'custom')).toBe(false);
    expect(all.map(pairKey)).not.toContain('youtube:story');
  });
});

describe('LEGACY_PAIRS', () => {
  test('is every objective pair exactly once', () => {
    const union = new Set(
      [...OBJECTIVE_OPTIONS.ugc_content, ...OBJECTIVE_OPTIONS.brand_awareness].map(pairKey),
    );
    const legacy = LEGACY_PAIRS.map(pairKey);
    expect(legacy).toHaveLength(13);
    expect(new Set(legacy)).toEqual(union);
  });
});

describe('objectiveLabel', () => {
  test('names each objective and nothing for null', () => {
    expect(objectiveLabel('ugc_content')).toBe('UGC Content');
    expect(objectiveLabel('brand_awareness')).toBe('Brand Awareness');
    expect(objectiveLabel(null)).toBeNull();
    expect(objectiveLabel(undefined)).toBeNull();
  });
});

describe('objectiveOptionLabel', () => {
  test("returns the objective's label for a listed pair, else null", () => {
    expect(objectiveOptionLabel('ugc_content', { platform: 'facebook', type: 'video' })).toBe(
      'Video for Facebook (Reel)',
    );
    expect(objectiveOptionLabel('brand_awareness', { platform: 'facebook', type: 'video' })).toBe(
      'Post video on Facebook (Reel)',
    );
    expect(objectiveOptionLabel('ugc_content', { platform: 'facebook', type: 'story' })).toBeNull();
    expect(objectiveOptionLabel(null, { platform: 'facebook', type: 'video' })).toBeNull();
  });
});

describe('isCustomItem', () => {
  test('is true only for the custom platform', () => {
    expect(isCustomItem({ platform: 'custom' })).toBe(true);
    expect(isCustomItem({ platform: 'instagram' })).toBe(false);
  });
});
