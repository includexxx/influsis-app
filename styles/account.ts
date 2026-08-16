import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Account scene (scenes/main/Profile.tsx, Figma
// "Account", node 6001:38957 + 6027:8164's logout popup) and its
// sub-screens (Edit Profile, Security Settings, Change Password, Privacy
// Policy, Help Center - docs/screen/profile).
export const accountStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  name: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  rowGroup: {
    gap: spacing['2xl'],
  },
  section: {
    marginBottom: spacing['3xl'],
  },
});
