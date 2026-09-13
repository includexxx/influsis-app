import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Help Center scene (scenes/main/HelpCenter.tsx,
// Figma "Help Center", node 6027:8303).
export const helpCenterStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  list: {
    gap: spacing.lg,
  },
});
