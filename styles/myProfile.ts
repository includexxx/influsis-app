import { StyleSheet } from 'react-native';
import { palette, radius, spacing, fonts } from '@/theme';
import { PROFILE_HERO_AVATAR_RING } from '@/components/elements/ProfileHero';

// Ad hoc tag-type accents the shared `palette` doesn't carry yet (teal,
// plum) alongside two it does (`gray` for languages, `warning` for the
// "gold" deliverables tag) — see docs/design-system.md's typography/color
// "known gaps" note for the precedent of extending tokens locally when a
// screen needs a shade Figma hasn't defined.
export const TAG_COLORS = {
  category: {
    light: { bg: '#CCFBF1', text: '#0F766E' },
    dark: { bg: 'rgba(45, 212, 191, 0.16)', text: '#5EEAD4' },
  },
  subcategory: {
    light: { bg: '#F3E8FF', text: '#86198F' },
    dark: { bg: 'rgba(192, 38, 211, 0.18)', text: '#E9A6F3' },
  },
  language: {
    light: { bg: palette.gray[25], text: palette.gray[400] },
    dark: { bg: palette.gray[700], text: palette.gray[100] },
  },
  deliverable: {
    light: { bg: palette.warning[50], text: palette.warning[700] },
    dark: { bg: 'rgba(253, 176, 34, 0.18)', text: palette.warning[300] },
  },
} as const;

export type TagColorKey = keyof typeof TAG_COLORS;

// Extras for the My Profile scene (scenes/main/MyProfile.tsx) — an
// editorial, single-column read view of the signed-in creator's own
// profile. Distinct from `creatorProfileStyle` (the public-facing Creator
// Profile card banner), since this screen's dark gradient hero, serif-
// flavored identity block, credibility strip and per-type tag coloring
// don't share that shape.
export const myProfileStyle = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centeredText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // --- Hero + avatar overlap ---------------------------------------------
  // The gradient band itself is `ProfileHero` (components/elements/
  // ProfileHero) — shared with EditProfile.tsx; this file only owns the
  // wrapper height and the avatar's overlap position.
  heroWrap: {
    height: 262, // 220 hero + 42 (half the 84px avatar) hanging below it
  },
  editPill: {
    height: 36,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.warning[300],
  },
  editPillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gray[900],
  },
  avatarRing: {
    position: 'absolute',
    left: spacing.lg,
    top: 178, // 220 (hero height) - 42 (half avatar), overlapping the boundary
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: PROFILE_HERO_AVATAR_RING,
  },

  // --- Identity block ------------------------------------------------------
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: fonts.clashDisplay.semibold,
    fontSize: 22,
    lineHeight: 28,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  handleText: {
    fontSize: 14,
  },
  metaDot: {
    fontSize: 14,
    marginHorizontal: spacing.xs,
  },
  locationInline: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },

  // --- Credibility strip -----------------------------------------------
  credCard: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
  },
  credColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  credValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  credLabel: {
    fontSize: 12,
  },
  credDivider: {
    width: 1,
  },

  // --- Repeating section pattern -----------------------------------------
  // The icon + label row itself is `IconSectionHeader` (components/elements/
  // IconSectionHeader) — shared with EditProfile.tsx.
  section: {
    marginTop: spacing.xl,
  },
  sectionBody: {
    marginTop: spacing.md,
  },
  tagRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagPill: {
    height: 30,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // --- Location card -------------------------------------------------------
  locationCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaRowDivider: {
    height: 1,
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },

  // --- Portfolio grid ------------------------------------------------------
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  portfolioTile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  portfolioPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  portfolioPlaceholderLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  addWorkTile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addWorkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
