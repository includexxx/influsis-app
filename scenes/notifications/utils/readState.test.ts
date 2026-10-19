import { describe, expect, test } from '@jest/globals';
import { NotificationItem } from '@/types';
import {
  applyReadState,
  EMPTY_READ_STATE,
  newestCreatedAt,
  withAllRead,
  withoutAllRead,
  withoutRead,
  withRead,
} from './readState';

function item(id: string, createdAt: string, readAt: string | null = null): NotificationItem {
  return {
    id,
    eventType: 'engagement.accepted',
    category: 'engagement',
    urgency: 'normal',
    title: id,
    body: '',
    target: { type: 'engagement', id: 'e-1', params: {} },
    readAt,
    resolvedAt: null,
    createdAt,
  };
}

const older = item('a', '2026-10-17T08:00:00.000Z');
const newer = item('b', '2026-10-17T09:00:00.000Z');
const AT = '2026-10-17T10:00:00.000Z';

describe('readState', () => {
  test('the empty state changes nothing', () => {
    expect(applyReadState([older, newer], EMPTY_READ_STATE)).toEqual([older, newer]);
  });

  test('withRead marks one item read; withoutRead reverts it', () => {
    const state = withRead(EMPTY_READ_STATE, 'a', AT);
    expect(applyReadState([older, newer], state).map(i => i.readAt)).toEqual([AT, null]);
    expect(applyReadState([older, newer], withoutRead(state, 'a'))).toEqual([older, newer]);
  });

  test('withAllRead marks only items created at or before `before`', () => {
    const state = withAllRead(EMPTY_READ_STATE, older.createdAt, AT);
    expect(applyReadState([older, newer], state).map(i => i.readAt)).toEqual([AT, null]);
  });

  test('an item already read keeps its server readAt', () => {
    const read = item('a', older.createdAt, '2026-10-17T08:30:00.000Z');
    const state = withAllRead(EMPTY_READ_STATE, newer.createdAt, AT);
    expect(applyReadState([read], state)[0].readAt).toBe('2026-10-17T08:30:00.000Z');
  });

  test('an older mark-all never shrinks a newer one', () => {
    const state = withAllRead(EMPTY_READ_STATE, newer.createdAt, AT);
    expect(withAllRead(state, older.createdAt, AT)).toBe(state);
  });

  test('withoutAllRead restores the previous mark-all, unless a later one replaced it', () => {
    const first = withAllRead(EMPTY_READ_STATE, older.createdAt, AT);
    const second = withAllRead(first, newer.createdAt, AT);
    expect(withoutAllRead(second, newer.createdAt, first)).toEqual(first);
    expect(withoutAllRead(second, older.createdAt, EMPTY_READ_STATE)).toBe(second);
  });

  test('newestCreatedAt finds the newest item, or nothing for an empty list', () => {
    expect(newestCreatedAt([older, newer])).toBe(newer.createdAt);
    expect(newestCreatedAt([newer, older])).toBe(newer.createdAt);
    expect(newestCreatedAt([])).toBeUndefined();
  });
});
