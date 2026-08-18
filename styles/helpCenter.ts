import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/theme';

// Shared fragments for the Help Center scene (scenes/main/HelpCenter.tsx,
// Figma "Help Center", node 6027:8303).
//
// Presentation reworked into an elevated hero card (tinted icon chip +
// heading + intro) above the FAQ accordion list, matching the
// card/chip/shadow language introduced by the Account screen redesign
// (styles/account.ts) - same questions/answers, same behavior, just
// restyled.
export const helpCenterStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconChipImage: {
    width: 28,
    height: 28,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: spacing.lg,
  },
});
