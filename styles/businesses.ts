import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Businesses scene (scenes/main/Businesses.tsx).
// The grid itself is a virtualized FlatList (`numColumns`) rather than a
// ScrollView, so (unlike most other scenes) this module carries the
// horizontal padding too - there's no shared scrollContent
// contentContainerStyle to supply it.
export const businessesStyle = StyleSheet.create({
  // Gap between the header and the logo grid - confirmed from Figma's
  // pixel positions (title bottom at y=93, grid top at y=109).
  headerGap: {
    marginBottom: 16,
    paddingHorizontal: spacing.lg,
  },
  // Vertical gap between grid rows - confirmed from Figma's pixel positions
  // (rows 122-123px tall starting 24px apart → 24px row gap). Used as the
  // manual grid's own container gap (the initial-loading skeleton, built as
  // plain rows) and, via paddingHorizontal/paddingBottom, as the FlatList's
  // contentContainerStyle.
  gridRows: {
    gap: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // One 4-column row - confirmed from Figma's pixel positions (94px circles
  // at x=0/102/204/306, ~8px column gap). `space-between` instead of a fixed
  // `columnGap` distributes the leftover space automatically so four 94px
  // circles always fit the row regardless of the exact container width.
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Same shape as gridRow, plus the row-to-row gap FlatList's `numColumns`
  // needs applied per row (as `columnWrapperStyle`) rather than once on the
  // container the way the manual skeleton grid's `gridRows.gap` does.
  columnWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
});
