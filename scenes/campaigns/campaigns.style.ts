import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Campaigns scene (scenes/campaigns/Campaigns.tsx).
// The list itself is a virtualized FlatList rather than a ScrollView, so
// (unlike most other scenes) this module carries the horizontal padding
// too - there's no shared scrollContent contentContainerStyle to supply it.
export const campaignsStyle = StyleSheet.create({
  // Gap between the header and the campaign list - confirmed from Figma's
  // pixel positions (title bottom at y=93, list top at y=109).
  headerGap: {
    marginBottom: 16,
    paddingHorizontal: spacing.lg,
  },
  // Vertical gap between stacked campaign cards - confirmed from Figma's
  // pixel positions (cards at y=0/263/541/819, 255-270px tall → 8px gap).
  listGap: {
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
