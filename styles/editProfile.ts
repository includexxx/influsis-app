import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/theme';

// Shared fragments for the Edit Profile scene (scenes/main/EditProfile.tsx,
// Figma "Profile", nodes 6001:39044 / 6399:5469 / 6398:8469 / 6398:5429).
//
// The fields were restyled from the original underline shape onto the
// bordered `TextField` shape the auth forms use (scenes/auth/SignUp.tsx), so
// the adornment sizes below are tuned to that row's 14px type rather than
// the 18px of the underline row.
export const editProfileStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: spacing['lg'],
  },
  // A soft tinted disc behind the avatar, sized by its own padding, so the
  // photo reads as the focal point of an otherwise plain form.
  avatarHalo: {
    padding: 6,
    borderRadius: radius.full,
  },
  phoneLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: spacing.sm,
  },
  phoneFlag: {
    width: 20,
    height: 14,
  },
  phoneDialCode: {
    fontSize: 14,
  },
  phoneChevron: {
    width: 14,
    height: 14,
  },
  // Divides the dial-code prefix from the number itself, the way the flag
  // and number are separated on the Figma field.
  phoneSeparator: {
    width: 1,
    height: 20,
    marginRight: spacing.md,
  },
  trailingIcon: {
    width: 20,
    height: 20,
    marginLeft: spacing.sm,
  },
});
