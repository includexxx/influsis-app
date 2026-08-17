import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Transaction scene (scenes/main/Transactions.tsx,
// Figma "Transaction", node 6212:7410) - a plain 16px-gutter list of 45px
// rows with no card, divider or section heading between them.
//
// Figma's frame is absolutely positioned; the values below are the measured
// deltas (list top 117 - header bottom 93 = 24, rows 61px apart on a 45px
// row = a 16px gap).
export const transactionsStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: spacing['2xl'],
  },
  list: {
    gap: spacing.lg,
  },
});
