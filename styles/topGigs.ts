import { StyleSheet } from 'react-native';

// Shared fragments for the Top Gigs scene (scenes/main/TopGigs.tsx).
export const topGigsStyle = StyleSheet.create({
  // Gap between the header and the gig list - confirmed from Figma's
  // pixel positions (title bottom at y=94, list top at y=109).
  headerGap: {
    marginBottom: 16,
  },
  // Vertical gap between stacked gig cards - confirmed from Figma's pixel
  // positions (cards at y=109/327/545/763/981, each 210px tall → 8px gap).
  listGap: {
    gap: 8,
  },
  // Overrides GigCard's fixed 356px horizontal-scroll width so it stretches
  // to the full-width column this vertical list uses instead.
  card: {
    width: '100%',
  },
});
