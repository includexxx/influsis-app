import { StyleSheet } from 'react-native';

// Shared fragments for the Top Creators scene (scenes/main/TopCreators.tsx).
export const topCreatorsStyle = StyleSheet.create({
  // Gap between the header and the creator list - confirmed from
  // Figma's pixel positions (title bottom at y=93, list top at y=109).
  headerGap: {
    marginBottom: 16,
  },
  // Vertical gap between stacked creator cards - confirmed from Figma's
  // pixel positions (cards at y=109/407/705/1003, each 288px tall → 10px
  // gap).
  listGap: {
    gap: 10,
  },
});
