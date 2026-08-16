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
    justifyContent: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 20,
  },
  phoneChevron: {
    width: 18,
    height: 18,
    marginTop: 4,
  },
  trailingIcon: {
    width: 18,
    height: 18,
  },
});
