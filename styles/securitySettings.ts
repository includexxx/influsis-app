import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Security Settings scene
// (scenes/main/SecuritySettings.tsx, Figma "Security Settings", node
// 6398:5198).
export const securitySettingsStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  // Gap between stacked toggle cards - confirmed from Figma's pixel
  // positions (cards at y=88/206/282/358, 52-94px tall, y-deltas match a
  // consistent 24px gap once each card's own height is subtracted).
  rowList: {
    gap: spacing['2xl'],
  },
  changePasswordGap: {
    marginTop: spacing['3xl'],
  },
});
