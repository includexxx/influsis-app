import { describe, expect, test } from '@jest/globals';

import {
  addableScopeOptions,
  addScopeItem,
  isSameScope,
  SCOPE_MESSAGES,
  scopeErrorsFromApi,
  scopeFromList,
  scopeItemLabel,
  scopeListErrorFromApi,
  scopeRowKey,
  validateScope,
} from './scope';

const custom = (title: string, description = '<p>Brief</p>', count = 1) => ({
  platform: 'custom',
  type: 'custom',
  count,
  title,
  description,
});

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

  test('keeps custom title and description untouched and drops nulls on catalogue items', () => {
    // CF3 scope rows, ids included.
    const rows = [
      { id: 'a', platform: 'tiktok', type: 'video', count: 1, title: null, description: null },
      {
        id: 'b',
        platform: 'custom',
        type: 'custom',
        count: 2,
        title: ' Unboxing ',
        description: '<p>Show the <strong>box</strong></p>',
      },
    ];
    expect(scopeFromList(rows)).toEqual([
      { platform: 'tiktok', type: 'video', count: 1 },
      {
        platform: 'custom',
        type: 'custom',
        count: 2,
        title: ' Unboxing ',
        description: '<p>Show the <strong>box</strong></p>',
      },
    ]);
  });
});

describe('scopeRowKey', () => {
  test('keys catalogue rows by pair and custom rows by position', () => {
    expect(scopeRowKey({ platform: 'instagram', type: 'reels' }, 3)).toBe('instagram:reels');
    expect(scopeRowKey(custom('A'), 1)).toBe('custom:1');
    expect(scopeRowKey(custom('A'), 2)).not.toBe(scopeRowKey(custom('A'), 1));
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

  test('allows repeated custom items and still checks their count', () => {
    expect(validateScope([custom('A'), custom('B')])).toEqual({
      ok: true,
      scope: [custom('A'), custom('B')],
    });
    expect(validateScope([custom('A', '<p>x</p>', 0)])).toEqual({
      ok: false,
      error: null,
      rowErrors: { 0: SCOPE_MESSAGES.count },
    });
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

  test('treats a custom title-only or description-only change as a change', () => {
    expect(isSameScope([custom('A')], [custom('A')])).toBe(true);
    expect(isSameScope([custom('A')], [custom('B')])).toBe(false);
    expect(isSameScope([custom('A', '<p>x</p>')], [custom('A', '<p>y</p>')])).toBe(false);
  });

  test('compares repeated custom items as a multiset', () => {
    expect(isSameScope([custom('A'), custom('B')], [custom('B'), custom('A')])).toBe(true);
    expect(isSameScope([custom('A'), custom('A')], [custom('A'), custom('B')])).toBe(false);
  });

  test('treats a missing and a null custom field as equal', () => {
    expect(
      isSameScope(
        [{ platform: 'tiktok', type: 'video', count: 1 }],
        [{ platform: 'tiktok', type: 'video', count: 1, title: null, description: null }],
      ),
    ).toBe(true);
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

  test("uses the objective's label when it lists the pair", () => {
    expect(scopeItemLabel({ platform: 'instagram', type: 'photo' }, 'ugc_content')).toBe(
      'Image for Instagram',
    );
    expect(scopeItemLabel({ platform: 'tiktok', type: 'post' }, 'brand_awareness')).toBe(
      'Post on TikTok',
    );
  });

  test('keeps the generic label for a pair the objective does not list (retired ugc)', () => {
    expect(scopeItemLabel({ platform: 'ugc', type: 'video' }, 'ugc_content')).toBe('UGC Video');
  });

  test('names a custom item by its title', () => {
    expect(scopeItemLabel(custom('Unboxing clip'), 'ugc_content')).toBe('Unboxing clip');
    expect(scopeItemLabel({ platform: 'custom', type: 'custom', title: null })).toBe(
      'Custom deliverable',
    );
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

  test('maps custom title and description keys to their row, first message wins', () => {
    expect(
      scopeErrorsFromApi({
        'scope[1].description': 'must contain text',
        'scope[1].title': 'required for a custom deliverable',
        'scope[3].title': 'must be at most 200 characters',
        'scope[x].title': 'ignored',
      }),
    ).toEqual({ 1: 'must contain text', 3: 'must be at most 200 characters' });
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

  test("offers only the objective's pairs not already listed, under its labels", () => {
    const ugc = addableScopeOptions(rows, 'ugc_content');
    expect(ugc.map(option => option.value)).not.toContain('instagram:reels');
    expect(ugc).toContainEqual({ label: 'Image for Instagram', value: 'instagram:photo' });
    expect(ugc.map(option => option.value)).not.toContain('facebook:story');
    expect(ugc).toHaveLength(6);

    const awareness = addableScopeOptions(rows, 'brand_awareness');
    expect(awareness).toContainEqual({ label: 'Post on TikTok', value: 'tiktok:post' });
    expect(awareness.map(option => option.value)).not.toContain('facebook:photo');
    expect(awareness).toHaveLength(9);
  });

  test('offers every non-retired pair, generically labelled, with no objective', () => {
    const options = addableScopeOptions([], null);
    expect(options).toHaveLength(13);
    expect(options).toContainEqual({ label: 'TikTok Video', value: 'tiktok:video' });
    expect(options.some(option => option.value.startsWith('ugc:'))).toBe(false);
    expect(options.some(option => option.value.startsWith('custom:'))).toBe(false);
  });

  test('appends a picked pair with count 1', () => {
    expect(addScopeItem(rows, 'tiktok:video', 'ugc_content')).toEqual([
      ...rows,
      { platform: 'tiktok', type: 'video', count: 1 },
    ]);
  });

  test('ignores unknown, off-objective, retired, duplicate, or over-limit picks', () => {
    expect(addScopeItem(rows, 'snapchat:lens', null)).toEqual(rows);
    expect(addScopeItem(rows, 'facebook:story', 'ugc_content')).toEqual(rows);
    expect(addScopeItem(rows, 'ugc:video', null)).toEqual(rows);
    expect(addScopeItem(rows, 'instagram:reels', 'ugc_content')).toEqual(rows);
    const full = Array.from({ length: 30 }, (_, index) => ({
      platform: 'x',
      type: `t${index}`,
      count: 1,
    }));
    expect(addScopeItem(full, 'tiktok:video', 'ugc_content')).toHaveLength(30);
  });
});
