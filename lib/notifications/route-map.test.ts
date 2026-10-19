import { describe, expect, test } from '@jest/globals';
import { NotificationTarget } from '@/types';
import { NOTIFICATIONS_PATH, routeFor } from './route-map';

// A copy of the backend's creator table for every Phase 1 creator event
// (../backend/docs/features/notifications/EVENT_CATALOG.md targets, resolved
// through ../backend/src/notifications/links/notification-links.ts). If the
// backend table changes, update this copy and route-map.ts together.
const PHASE_1_CREATOR_EVENTS: [eventType: string, target: NotificationTarget, path: string][] = [
  ['campaign.cancelled', { type: 'engagement', id: 'e-1', params: {} }, '/engagement/e-1'],
  [
    'engagement.invited',
    { type: 'engagement', id: 'e-1', params: { campaignId: 'c-1' } },
    '/engagement/e-1',
  ],
  [
    'engagement.accepted',
    { type: 'engagement', id: 'e-1', params: { campaignId: 'c-1' } },
    '/engagement/e-1',
  ],
  [
    'engagement.declined',
    { type: 'engagement', id: 'e-1', params: { origin: 'requested' } },
    '/engagement/e-1',
  ],
  ['engagement.cancelled', { type: 'engagement', id: 'e-1', params: {} }, '/engagement/e-1'],
  [
    'engagement.completed',
    { type: 'engagement', id: 'e-1', params: { campaignId: 'c-1' } },
    '/engagement/e-1',
  ],
  [
    'offer.countered',
    { type: 'engagement', id: 'e-1', params: { origin: 'invited' } },
    '/engagement/e-1',
  ],
  ['offer.withdrawn', { type: 'engagement', id: 'e-1', params: {} }, '/engagement/e-1'],
  ['offer.limit_raised', { type: 'engagement', id: 'e-1', params: {} }, '/engagement/e-1'],
  [
    'delivery.changes_requested',
    { type: 'delivery', id: 'e-1', params: { roundId: 'r-1' } },
    '/engagement/e-1/submit-delivery',
  ],
  [
    'delivery.draft_approved',
    { type: 'delivery', id: 'e-1', params: {} },
    '/engagement/e-1/submit-delivery',
  ],
  ['delivery.escalated', { type: 'delivery', id: 'e-1', params: {} }, '/engagement/e-1'],
  ['review.prompt', { type: 'review', id: 'e-1', params: {} }, '/engagement/e-1/review'],
  ['review.published', { type: 'profile', id: 'u-1', params: { reviewId: 'rv-1' } }, '/my-profile'],
  ['review.hidden', { type: 'engagement', id: 'e-1', params: {} }, '/engagement/e-1/review'],
  [
    'verification.approved',
    { type: 'account', id: 'u-1', params: { section: 'verification' } },
    '/my-profile',
  ],
  [
    'verification.rejected',
    { type: 'account', id: 'u-1', params: { section: 'verification' } },
    '/my-profile',
  ],
  ['account.suspended', { type: 'account', id: 'u-1', params: {} }, '/my-profile'],
];

describe('routeFor', () => {
  test('covers all 18 Phase 1 creator events', () => {
    expect(PHASE_1_CREATOR_EVENTS).toHaveLength(18);
  });

  test.each(PHASE_1_CREATOR_EVENTS)(
    '%s opens the backend table path',
    (eventType, target, path) => {
      expect(routeFor({ eventType, target })).toBe(path);
    },
  );

  test('a campaign target opens the campaign', () => {
    expect(
      routeFor({
        eventType: 'campaign.future',
        target: { type: 'campaign', id: 'c-1', params: {} },
      }),
    ).toBe('/campaign/c-1');
  });

  test('an unknown eventType on a known target uses the target', () => {
    expect(
      routeFor({
        eventType: 'delivery.something_new',
        target: { type: 'delivery', id: 'e-9', params: {} },
      }),
    ).toBe('/engagement/e-9/submit-delivery');
  });

  test('an unknown target type falls back to the notifications page', () => {
    expect(
      routeFor({ eventType: 'wallet.paid', target: { type: 'wallet', id: 'w-1', params: {} } }),
    ).toBe(NOTIFICATIONS_PATH);
  });

  test('overrides beat their target type', () => {
    expect(
      routeFor({
        eventType: 'delivery.escalated',
        target: { type: 'delivery', id: 'e-1', params: {} },
      }),
    ).toBe('/engagement/e-1');
    expect(
      routeFor({
        eventType: 'review.hidden',
        target: { type: 'engagement', id: 'e-1', params: {} },
      }),
    ).toBe('/engagement/e-1/review');
  });

  test('ids are URI-encoded', () => {
    expect(
      routeFor({
        eventType: 'engagement.accepted',
        target: { type: 'engagement', id: 'a/b?c', params: {} },
      }),
    ).toBe('/engagement/a%2Fb%3Fc');
  });
});
