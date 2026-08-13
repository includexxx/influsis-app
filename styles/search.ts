import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Search scene (scenes/main/Search.tsx).
export const searchStyle = StyleSheet.create({
  // Gap between the header and the search bar.
  headerGap: {
    marginBottom: spacing.lg,
  },
  // Gap between the search bar and the category chip row.
  searchBarGap: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  // Horizontal gap between category chips, matching Figma's confirmed 8px
  // (chip x-positions: 0/72/154/237/366 for 64/74/75/121-wide chips).
  chipRowGap: {
    gap: 8,
  },
  // Gap between the chip row and the results/empty-state area below it.
  resultsGap: {
    marginTop: spacing['2xl'],
  },
  // Vertical gap between stacked result cards - confirmed from Figma's
  // pixel positions (cards at y=237/504/771, each 253 tall → 14px gap).
  resultsListGap: {
    gap: 14,
  },
  // Centers the empty state within the remaining scroll space.
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
  },
});
