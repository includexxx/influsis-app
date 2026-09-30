import { describe, expect, test } from '@jest/globals';

import {
  addableScopeOptions,
  addScopeItem,
  isSameScope,
  SCOPE_CATALOG,
  SCOPE_MESSAGES,
  scopeErrorsFromApi,
  scopeFromList,
  scopeItemLabel,
  scopeListErrorFromApi,
  scopePairKey,
  validateScope,
} from './scope';

describe('scopeFromList', () => {
  test('drops ids and keeps order', () => {
    expect(
      scopeFromList([
        { id: 'a', platform: 'tiktok', type: 'video', count: 1 },
        { id: 'b', platform: 'instagram', type: 'reels', count: 2 },
      ] as { id: string; platform: string; type: string; count: number }[]),
    ).toEqual([
      { platform: 'tiktok', type: 'video', count: 1 },
      { platform: 'instagram', type: 'reels', count: 2 },
    ]);
  });
});

describe('validateScope', () => {
  test('accepts a valid list', () => {
    expect(validateScope([{ platform: 'instagram', type: 'reels', count: 2 }])).toEqual({
      ok: true,
      scope: [{ platform: 'instagram', type: 'reels', count: 2 }],
    });
  });

  test('rejects an empty list', () => {
    expect(validateScope([])).toEqual({ ok: false, error: SCOPE_MESSAGES.empty, rowErrors: {} });
  });

  test('rejects more than 30 items', () => {
    const rows = Array.from({ length: 31 }, (_, index) => ({
      platform: 'instagram',
      type: `t${index}`,
      count: 1,
    }));
    expect(validateScope(rows)).toMatchObject({ ok: false, error: SCOPE_MESSAGES.tooMany });
  });

  test('flags counts outside 1-50 or not whole on their row', () => {
    expect(
      validateScope([
        { platform: 'instagram', type: 'reels', count: 0 },
        { platform: 'tiktok', type: 'video', count: 51 },
        { platform: 'youtube', type: 'shorts', count: 1.5 },
        { platform: 'ugc', type: 'photo', count: 50 },
      ]),
    ).toEqual({
      ok: false,
      error: null,
      rowErrors: { 0: SCOPE_MESSAGES.count, 1: SCOPE_MESSAGES.count, 2: SCOPE_MESSAGES.count },
    });
  });

  test('flags a repeated platform + type on the later row', () => {
    expect(
      validateScope([
        { platform: 'instagram', type: 'reels', count: 1 },
        { platform: 'instagram', type: 'reels', count: 2 },
      ]),
    ).toEqual({ ok: false, error: null, rowErrors: { 1: SCOPE_MESSAGES.duplicate } });
  });
});

describe('isSameScope', () => {
  const current = [
    { platform: 'instagram', type: 'reels', count: 2 },
    { platform: 'tiktok', type: 'video', count: 1 },
  ];

  test('ignores order', () => {
    expect(isSameScope(current, [...current].reverse())).toBe(true);
  });

  test('treats a count change as a change', () => {
    expect(
      isSameScope(current, [
        { platform: 'instagram', type: 'reels', count: 3 },
        { platform: 'tiktok', type: 'video', count: 1 },
      ]),
    ).toBe(false);
  });

  test('treats an added or removed item as a change', () => {
    expect(isSameScope(current, current.slice(0, 1))).toBe(false);
    expect(isSameScope(current, [...current, { platform: 'ugc', type: 'photo', count: 1 }])).toBe(
      false,
    );
  });
});

describe('scopeItemLabel', () => {
  test('uses the platform and type labels', () => {
    expect(scopeItemLabel({ platform: 'instagram', type: 'reels' })).toBe('Instagram Reels');
    expect(scopeItemLabel({ platform: 'facebook', type: 'post' })).toBe('Facebook Post');
  });

  test('falls back to raw values for an unknown pair', () => {
    expect(scopeItemLabel({ platform: 'snapchat', type: 'lens' })).toBe('snapchat lens');
  });
});

describe('SCOPE_CATALOG', () => {
  test('has no duplicate pairs and only backend platforms/types', () => {
    const keys = SCOPE_CATALOG.map(scopePairKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const item of SCOPE_CATALOG) {
      expect(['facebook', 'instagram', 'tiktok', 'youtube', 'ugc']).toContain(item.platform);
      expect(['video', 'shorts', 'reels', 'story', 'post', 'photo']).toContain(item.type);
    }
  });
});

describe('scopeErrorsFromApi', () => {
  test('reads the flat duplicate keys and ignores other fields', () => {
    expect(
      scopeErrorsFromApi({
        'scope[2]': 'duplicate platform/type - send count instead',
        amountMinor: 'must be positive',
      }),
    ).toEqual({ 2: 'duplicate platform/type - send count instead' });
  });

  test('returns nothing for a missing error map', () => {
    expect(scopeErrorsFromApi(null)).toEqual({});
    expect(scopeErrorsFromApi(undefined)).toEqual({});
  });
});

describe('scopeListErrorFromApi', () => {
  test('returns the list-level scope message when present', () => {
    expect(scopeListErrorFromApi({ scope: 'scope must contain at least 1 elements' })).toBe(
      'scope must contain at least 1 elements',
    );
    expect(scopeListErrorFromApi({ note: 'too long' })).toBeNull();
    expect(scopeListErrorFromApi(null)).toBeNull();
  });
});

describe('addableScopeOptions / addScopeItem', () => {
  const rows = [{ platform: 'instagram', type: 'reels', count: 2 }];

  test('offers only catalog pairs not already listed', () => {
    const options = addableScopeOptions(rows);
    expect(options.map(option => option.value)).not.toContain('instagram:reels');
    expect(options).toContainEqual({ label: 'TikTok Video', value: 'tiktok:video' });
    expect(options).toHaveLength(SCOPE_CATALOG.length - 1);
  });

  test('appends a picked pair with count 1', () => {
    expect(addScopeItem(rows, 'tiktok:video')).toEqual([
      ...rows,
      { platform: 'tiktok', type: 'video', count: 1 },
    ]);
  });

  test('ignores unknown, duplicate, or over-limit picks', () => {
    expect(addScopeItem(rows, 'snapchat:lens')).toEqual(rows);
    expect(addScopeItem(rows, 'instagram:reels')).toEqual(rows);
    const full = Array.from({ length: 30 }, (_, index) => ({
      platform: 'x',
      type: `t${index}`,
      count: 1,
    }));
    expect(addScopeItem(full, 'tiktok:video')).toHaveLength(30);
  });
});
