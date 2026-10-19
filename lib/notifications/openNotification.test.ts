import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { router } from 'expo-router';
import { NotificationItem } from '@/types';
import { openNotification } from './openNotification';
import { takeNotificationRoute } from './pendingRoute';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const push = router.push as jest.Mock;

const item: NotificationItem = {
  id: 'n-1',
  eventType: 'engagement.accepted',
  category: 'engagement',
  urgency: 'high',
  title: 'Offer accepted',
  body: 'Accepted.',
  target: { type: 'engagement', id: 'e-1', params: {} },
  readAt: null,
  resolvedAt: null,
  createdAt: '2026-10-17T09:30:00.000Z',
};

beforeEach(() => {
  push.mockClear();
  takeNotificationRoute();
});

describe('openNotification', () => {
  test('signed in: marks an unread item read and pushes its route', () => {
    const markRead = jest.fn();
    openNotification(item, { status: 'authenticated', markRead, currentPath: '/notifications' });

    expect(markRead).toHaveBeenCalledWith(item);
    expect(push).toHaveBeenCalledWith('/engagement/e-1');
    expect(takeNotificationRoute()).toBeNull();
  });

  test('an already-read item is not marked again', () => {
    const markRead = jest.fn();
    openNotification(
      { ...item, readAt: '2026-10-17T10:00:00.000Z' },
      { status: 'authenticated', markRead },
    );

    expect(markRead).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/engagement/e-1');
  });

  test('a fallback route equal to the current screen does not navigate', () => {
    const markRead = jest.fn();
    openNotification(
      { ...item, eventType: 'wallet.paid', target: { type: 'wallet', id: 'w-1', params: {} } },
      { status: 'authenticated', markRead, currentPath: '/notifications' },
    );

    expect(markRead).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  test.each(['restoring', 'unauthenticated'] as const)(
    '%s: holds the route instead of navigating',
    status => {
      openNotification(item, { status, markRead: jest.fn() });

      expect(push).not.toHaveBeenCalled();
      expect(takeNotificationRoute()).toBe('/engagement/e-1');
    },
  );
});
