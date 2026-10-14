import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Layout for the Applications tab (scenes/campaigns/Applications.tsx): a
// fixed header (title row + segmented control) over the scrolling list. The
// cards themselves are styled in components/applications/.
export const applicationsStyle = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing['3xl'],
  },
  separator: {
    height: spacing.md,
  },
  skeletonGap: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
  },
});
