export type NotificationIconName = 'money-tick' | 'wallet';

export interface NotificationItem {
  id: string;
  icon: NotificationIconName;
  title: string;
  description: string;
  time: string;
}
