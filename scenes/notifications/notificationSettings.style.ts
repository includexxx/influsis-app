import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Notification settings scene
// (scenes/notifications/NotificationSettings.tsx).
export const notificationSettingsStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
  },
  sectionGap: {
    marginTop: spacing['3xl'],
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
  // Gap between stacked toggle cards, as on Security Settings.
  rowList: {
    gap: spacing.lg,
  },
  status: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
  },
  statusText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 28,
    height: 44,
    borderRadius: 22,
  },
  retryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  alert: {
    fontSize: 13,
    lineHeight: 19,
  },
});
