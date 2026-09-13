import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Order scene (scenes/main/Order.tsx, Figma
// "Order_Campaign" - nodes 6212:5540 "Campaign" tab, 6212:5843 "Gig order"
// tab, 6212:6024 "Completed" tab, 6403:5508 "Cancelled" tab, plus the
// 6366:6730/6574:6415 empty states).
export const orderStyle = StyleSheet.create({
  // Gap between the header and the filter tab row - confirmed from Figma's
  // pixel positions (header title at y=63, tab row at y=103).
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  // Vertical gap between order cards - confirmed from Figma's pixel
  // positions across all 4 tabs (cards 16px apart regardless of card
  // height, e.g. 98px "Campaign" cards at y=154/268 and 143px "Gig order"
  // cards at y=152/311).
  listGap: {
    gap: spacing.lg,
  },
  // Centers the empty state within the remaining scroll space, matching
  // the Search screen's `searchStyle.emptyState` approach rather than
  // Figma's exact mid-screen vertical centering.
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['6xl'],
  },
});
