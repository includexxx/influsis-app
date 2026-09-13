import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the withdraw confirmation screen
// (scenes/main/WithdrawSuccess.tsx, Figma node 6407:5772). It has no header
// and no CTA: Figma shows the confetti hero, a receipt pill and two detail
// lines, nothing else.
export const withdrawSuccessStyle = StyleSheet.create({
  // Figma insets this screen's content 27px rather than the 16px every
  // other screen in the flow uses (node 6407:5815 at x=27, w=376).
  content: {
    flexGrow: 1,
    paddingHorizontal: 27,
    paddingBottom: spacing['2xl'],
  },
  hero: {
    marginTop: spacing['4xl'],
  },
  // Figma's own 40px gap between the headline, the receipt pill and the
  // detail lines (node 6407:5815's container gap).
  receipt: {
    marginTop: spacing['4xl'],
  },
  details: {
    marginTop: spacing['4xl'],
    gap: spacing.lg,
  },
});
