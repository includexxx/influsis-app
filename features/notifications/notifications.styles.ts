import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Notifications scene (scenes/main/Notifications.tsx).
export const notificationsStyle = StyleSheet.create({
  // Vertical gap between the header and the notification list.
  headerGap: {
    marginBottom: spacing.xl,
  },
  // Vertical gap between stacked NotificationCards.
  listGap: {
    gap: 12,
  },
  // Gap between the "Last 24 Hours" label and the recent-notifications group
  // above it.
  sectionLabelGap: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
    fontWeight: '600',
  },
});
