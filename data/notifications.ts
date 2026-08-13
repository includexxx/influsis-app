import { NotificationItem } from '@/types';

// Mock content for the Notifications screen (scenes/main/Notifications.tsx),
// standing in for a real notifications API - see
// docs/screen/notifications/README.md "Scope notes" and docs/PRD.md §2.2/§4.1
// (no backend exists yet). Split into the two groups Figma shows: recent
// (unlabeled) notifications, then a "Last 24 Hours" labeled group.

export const recentNotifications: NotificationItem[] = [
  {
    id: 'transfer-success-1',
    icon: 'money-tick',
    title: 'Transfer Success',
    description: 'you have successfully sent johnatan $10.00',
    time: '12:45 am',
  },
  {
    id: 'receive-payment-1',
    icon: 'wallet',
    title: 'Receive payment',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '12:55 am',
  },
  {
    id: 'receive-payment-3333',
    icon: 'wallet',
    title: 'Receive payment',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '12:55 am',
  },
];

export const last24HoursNotifications: NotificationItem[] = [
  {
    id: 'campaign-join-accepted',
    icon: 'wallet',
    title: 'Campaign Join Request Accepted',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '2 hours ago',
  },
  {
    id: 'transfer-success-2',
    icon: 'money-tick',
    title: 'Transfer Success',
    description: 'you have successfully sent johnatan $10.00',
    time: '5 hours ago',
  },
  {
    id: 'receive-payment-2',
    icon: 'wallet',
    title: 'Receive payment',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '5 hours ago',
  },
  {
    id: 'receive-payment-3',
    icon: 'wallet',
    title: 'Receive payment',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '5 hours ago',
  },
  {
    id: 'receive-payment-4',
    icon: 'wallet',
    title: 'Receive payment',
    description: 'You received a payment from alex ferdinand of $5000',
    time: '5 hours ago',
  },
];
