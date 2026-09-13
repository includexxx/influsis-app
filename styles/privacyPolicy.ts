import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Privacy Policy scene
// (scenes/main/PrivacyPolicy.tsx, Figma "Privacy Policy", node 6027:8267).
export const privacyPolicyStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  heading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  bulletLabel: {
    fontWeight: '700',
  },
});
