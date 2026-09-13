import { StyleSheet } from 'react-native';
import { palette, spacing } from '@/theme';

// Shared fragments for the Balance scene (scenes/main/Balance.tsx, Figma
// "Balance", node 6402:5295).
//
// Figma's frame is absolutely positioned; the gaps below are the measured
// deltas between those positions (hero card top 111 - header bottom 93 = 18,
// tiles top 322 - card bottom 302 = 20, heading top 440 - tiles bottom
// 408 = 32, first row top 482 - heading bottom 467 = 15).
export const balanceStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: 18,
  },
  earningRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    marginTop: spacing['3xl'],
    color: palette.gray[900],
  },
  // Figma stacks the four tiles 83px apart on a 73px row, i.e. a 10px gap.
  optionList: {
    marginTop: spacing.lg,
    gap: 10,
  },
});
