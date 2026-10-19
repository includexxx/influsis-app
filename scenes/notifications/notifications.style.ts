import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/theme';

// Shared fragments for the Notifications scene (scenes/notifications/Notifications.tsx).
export const notificationsStyle = StyleSheet.create({
  // Vertical gap between the header and the tabs.
  headerGap: {
    marginBottom: spacing.xl,
  },
  // The row under the tabs holding "Mark all as read".
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 44,
    marginTop: spacing.sm,
  },
  toolbarAction: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
    fontWeight: '600',
  },
  // Inline error / notice lines (mark-all failure, refresh failure).
  inlineMessage: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  // Gap below the header block, before the first card.
  listTop: {
    height: spacing.md,
  },
  // Vertical gap between stacked NotificationCards.
  separator: {
    height: 12,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  footerRetry: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  // The list's own skeleton / empty / error block.
  status: {
    paddingTop: spacing['2xl'],
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 10,
    padding: spacing.lg,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
  },
  skeletonText: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  skeletonTitle: {
    width: '70%',
    height: 14,
    borderRadius: 6,
  },
  skeletonBody: {
    width: '90%',
    height: 12,
    borderRadius: 6,
  },
  statusBlock: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
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
});
