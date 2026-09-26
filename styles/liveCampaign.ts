import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Live Campaign scene (scenes/main/LiveCampaign.tsx).
// The list itself is a virtualized FlatList rather than a ScrollView, so
// (unlike most other scenes) this module carries the horizontal padding
// too - there's no shared scrollContent contentContainerStyle to supply it.
export const liveCampaignStyle = StyleSheet.create({
  // Gap between the header and the campaign list - confirmed from Figma's
  // pixel positions (title bottom at y=93, first card top at y=109).
  headerGap: {
    marginBottom: 16,
    paddingHorizontal: spacing.lg,
  },
  // Vertical gap between stacked campaign cards - confirmed from Figma's
  // pixel positions (cards at y=109/378/647/..., each 253 tall → 16px gap).
  listGap: {
    gap: 16,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
