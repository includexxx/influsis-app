import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Messages scene (scenes/main/Message.tsx).
export const messagesStyle = StyleSheet.create({
  // Gap between the "Messages" header and the search bar - Figma's header
  // sits at y=63 (30 tall) with the search bar at y=108.
  headerGap: {
    marginBottom: 15,
  },
  // Gap between the search bar (ends y=158) and the first conversation row
  // (starts y=173).
  searchBarGap: {
    marginBottom: 15,
  },
  // Vertical gap between stacked ConversationCards - confirmed from Figma's
  // pixel positions (rows at y=173/255/337/..., each 66 tall -> 16px gap).
  listGap: {
    gap: 16,
  },
  // Centers the empty state in the space below the search bar. Figma puts
  // the illustration at y=351.5 with the search bar ending at y=158.
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['7xl'],
  },
});
