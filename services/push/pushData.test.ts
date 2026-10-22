import { describe, expect, test } from '@jest/globals';
import { parsePushData, pushTapPath } from './pushData';

const single = (overrides: Record<string, unknown> = {}) => ({
  kind: 'single',
  notificationId: 'n-1',
  eventType: 'engagement.accepted',
  urgency: 'high',
  targetType: 'engagement',
  targetId: 'e-1',
  targetParams: '{"campaignId":"c-1"}',
  ...overrides,
});

describe('parsePushData', () => {
  test('a full single push', () => {
    expect(parsePushData(single())).toEqual({
      kind: 'single',
      notificationId: 'n-1',
      eventType: 'engagement.accepted',
      urgency: 'high',
      target: { type: 'engagement', id: 'e-1', params: { campaignId: 'c-1' } },
    });
  });

  test('no targetParams means no params', () => {
    const data: Record<string, unknown> = single();
    delete data.targetParams;
    expect(parsePushData(data)).toEqual(
      expect.objectContaining({ target: { type: 'engagement', id: 'e-1', params: {} } }),
    );
  });

  test('a batch', () => {
    expect(parsePushData({ kind: 'batch', urgency: 'normal' })).toEqual({ kind: 'batch' });
  });

  test('an unknown urgency reads as normal', () => {
    expect(parsePushData(single({ urgency: 'urgent' }))).toEqual(
      expect.objectContaining({ urgency: 'normal' }),
    );
  });

  test.each([
    ['invalid JSON', '{campaignId:'],
    ['an array', '["c-1"]'],
    ['a string', '"c-1"'],
    ['a non-string value', '{"campaignId":1}'],
  ])('bad targetParams (%s) is unreadable', (_name, targetParams) => {
    expect(parsePushData(single({ targetParams }))).toBeNull();
  });

  test.each(['notificationId', 'eventType', 'targetType', 'targetId'])(
    'a single push without %s is unreadable',
    key => {
      expect(parsePushData(single({ [key]: undefined }))).toBeNull();
      expect(parsePushData(single({ [key]: '' }))).toBeNull();
      expect(parsePushData(single({ [key]: 7 }))).toBeNull();
    },
  );

  test.each([undefined, {}, { kind: 'digest' }])('%o is unreadable', data => {
    expect(parsePushData(data)).toBeNull();
  });
});

describe('pushTapPath', () => {
  test.each([
    ['engagement.accepted', 'engagement', '/engagement/e-1?n=n-1'],
    ['delivery.changes_requested', 'delivery', '/engagement/e-1/submit-delivery?n=n-1'],
    ['delivery.escalated', 'delivery', '/engagement/e-1?n=n-1'],
    ['review.prompt', 'review', '/engagement/e-1/review?n=n-1'],
    ['review.hidden', 'engagement', '/engagement/e-1/review?n=n-1'],
    ['review.published', 'profile', '/my-profile?n=n-1'],
    ['verification.approved', 'account', '/my-profile?n=n-1'],
    ['campaign.future', 'campaign', '/campaign/e-1?n=n-1'],
  ])('%s (%s target) -> %s', (eventType, targetType, path) => {
    expect(pushTapPath(parsePushData(single({ eventType, targetType })))).toBe(path);
  });

  test('an unknown target falls back to the notifications page, still marking it read', () => {
    expect(pushTapPath(parsePushData(single({ eventType: 'x.y', targetType: 'wallet' })))).toBe(
      '/notifications?n=n-1',
    );
  });

  test('a batch opens the notifications page and marks nothing read', () => {
    expect(pushTapPath(parsePushData({ kind: 'batch' }))).toBe('/notifications');
  });

  test('bad data opens the notifications page', () => {
    expect(pushTapPath(parsePushData(single({ targetParams: 'nope' })))).toBe('/notifications');
    expect(pushTapPath(null)).toBe('/notifications');
  });

  test('the notification id is URI-encoded', () => {
    expect(pushTapPath(parsePushData(single({ notificationId: 'a/b c' })))).toBe(
      '/engagement/e-1?n=a%2Fb%20c',
    );
  });
});
