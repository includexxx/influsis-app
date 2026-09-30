import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Top Creators scene (scenes/creator/TopCreators.tsx).
// The list itself is a virtualized FlatList rather than a ScrollView, so
// (unlike most other scenes) this module carries the horizontal padding
// too - there's no shared scrollContent contentContainerStyle to supply it.
export const topCreatorsStyle = StyleSheet.create({
  // Gap between the header and the creator list - confirmed from
  // Figma's pixel positions (title bottom at y=93, list top at y=109).
  headerGap: {
    marginBottom: 16,
    paddingHorizontal: spacing.lg,
  },
  // Vertical gap between stacked creator cards - confirmed from Figma's
  // pixel positions (cards at y=109/407/705/1003, each 288px tall → 10px
  // gap).
  listGap: {
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
