import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Change Password scene
// (scenes/main/ChangePassword.tsx, Figma "Change Password", node
// 6027:8414).
export const changePasswordStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  fieldGroup: {
    gap: spacing.xl,
    marginBottom: spacing['3xl'],
  },
});
