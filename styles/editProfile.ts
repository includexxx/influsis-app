import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the Edit Profile scene (scenes/main/EditProfile.tsx,
// Figma "Profile", nodes 6001:39044 / 6399:5469 / 6398:8469 / 6398:5429).
export const editProfileStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['3xl'],
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  phoneLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  phoneChevron: {
    width: 16,
    height: 16,
  },
  trailingIcon: {
    width: 24,
    height: 24,
  },
});
