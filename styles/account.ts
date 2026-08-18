import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// Shared fragments for the Account scene (scenes/main/Profile.tsx, Figma
// "Account", node 6001:38957 + 6027:8164's logout popup) and its
// sub-screens (Edit Profile, Security Settings, Change Password, Privacy
// Policy, Help Center - docs/screen/profile).
//
// The Account scene's own presentation was reworked into a gradient
// identity header + grouped setting cards (same rows, same destinations,
// same copy as Figma - see docs/screen/profile/account.md); the sub-screen
// fragments below it are untouched.
export const accountStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },

  // --- Account screen ---------------------------------------------------
  // The hero is full-bleed, so horizontal padding moves onto `body` rather
  // than sitting on the scroll container.
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  // Two out-of-frame translucent discs give the flat gradient some depth;
  // `hero`'s overflow clip is what turns them into corner arcs.
  heroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -45,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  // A padded translucent circle behind the avatar reads as a ring without
  // relying on border support in the underlying image renderer.
  avatarRing: {
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  name: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.lg,
    color: palette.white,
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
    marginBottom: spacing.md,
  },
  rowGroup: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: spacing.md,
  },
  // Inset to clear the 40px icon chip + its 12px gap, so the rule starts
  // under the label rather than cutting the whole card in half.
  rowDivider: {
    height: 1,
    marginLeft: 52,
  },
});
