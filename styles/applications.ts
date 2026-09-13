import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Applications scene (scenes/main/Applications.tsx,
// Figma "List", nodes 6015:7090 "Applied" tab + 6475:6394 "Request" tab).
// Figma's own header-to-tabs gap differs slightly between the two tab
// states (34px vs 16px, the same frame just measured twice) - `headerGap`
// below picks a single consistent in-between value rather than switching
// the whole screen's spacing when the tab changes.
export const applicationsStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  // Vertical gap between "Applied" tab cards - confirmed from Figma's pixel
  // positions (cards 211px tall, 16px apart, node 6015:7090).
  appliedListGap: {
    gap: spacing.lg,
  },
  // Vertical gap between "Request" tab rows - confirmed from Figma's pixel
  // positions (rows 114px tall, 10px apart, node 6475:6394).
  requestListGap: {
    gap: 10,
  },
});
