import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/theme';
import { PROFILE_HERO_AVATAR_RING } from '@/components/elements/ProfileHero';

// Shared fragments for the Edit Profile scene (scenes/main/EditProfile.tsx,
// Figma "Profile", nodes 6001:39044 / 6399:5469 / 6398:8469 / 6398:5429).
//
// The fields were restyled from the original underline shape onto the
// bordered `TextField` shape the auth forms use (scenes/auth/SignUp.tsx), so
// the adornment sizes below are tuned to that row's 14px type rather than
// the 18px of the underline row.
//
// The screen's top chrome (dark `ProfileHero` band + overlapping avatar
// ring) matches scenes/main/MyProfile.tsx's editorial treatment — see that
// screen and `styles/myProfile.ts` for the shared pieces. Unlike MyProfile's
// left-aligned identity-card avatar, this form centers the avatar (matching
// this screen's own prior centered layout), so the ring position here is
// centered rather than reused from `myProfileStyle`.
export const editProfileStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  heroWrap: {
    height: 262, // 220 hero + 42 (half the 84px avatar) hanging below it
  },
  avatarRing: {
    position: 'absolute',
    left: '50%',
    marginLeft: -46, // half of (84px avatar + 4px ring padding * 2)
    top: 178, // 220 (hero height) - 42 (half avatar), overlapping the boundary
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: PROFILE_HERO_AVATAR_RING,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  photoUploader: {
    marginTop: spacing.md,
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
