import { StyleSheet } from 'react-native';

// Shared fragments for the Campaigns scene (scenes/main/Campaigns.tsx).
export const campaignsStyle = StyleSheet.create({
  // Gap between the header and the campaign list - confirmed from Figma's
  // pixel positions (title bottom at y=93, list top at y=109).
  headerGap: {
    marginBottom: 16,
  },
  // Vertical gap between stacked campaign cards - confirmed from Figma's
  // pixel positions (cards at y=0/263/541/819, 255-270px tall → 8px gap).
  listGap: {
    gap: 8,
  },
});
