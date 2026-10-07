import { StyleSheet } from 'react-native';
import { fonts, getShadowStyle, palette, radius, spacing } from '@/theme';

// The Profile tab (scenes/profile/Profile.tsx) and its pieces under
// scenes/profile/components (ProfileHeader, ProfileStats,
// ProfileStrengthCard, ProfileMenu). Theme-dependent colors are applied
// inline by each component; everything here is shape and type.

// How far the stats card is pulled up into the header. The header reserves
// the same amount of bottom padding so its content never sits under it.
export const STATS_OVERLAP = 44;

export const accountStyle = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  // Paints the header's top color above the content, so an iOS overscroll
  // bounce reveals more header instead of a white strip.
  overscrollCap: {
    position: 'absolute',
    top: -600,
    left: 0,
    right: 0,
    height: 600,
  },
  pressed: {
    opacity: 0.85,
  },

  // --- Header -----------------------------------------------------------
  header: {
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerFill: {
    ...StyleSheet.absoluteFillObject,
  },
  // Two out-of-frame translucent discs give the gradient some depth; the
  // header's overflow clip turns them into corner arcs.
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.clashDisplay.semibold,
    color: palette.white,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  // A padded translucent circle behind the avatar reads as a ring without
  // relying on border support in the underlying image renderer.
  avatarRing: {
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  verifiedDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.success[500],
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.clashDisplay.semibold,
    color: palette.white,
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  glassPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.white,
  },
  viewProfilePill: {
    marginLeft: 'auto',
    backgroundColor: palette.white,
    borderColor: palette.white,
  },
  viewProfileText: {
    color: palette.primary[600],
  },

  // --- Stats card ---------------------------------------------------------
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: -STATS_OVERLAP,
    paddingVertical: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    ...getShadowStyle('md'),
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    marginVertical: spacing.xs,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: fonts.clashDisplay.semibold,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  // --- Body ---------------------------------------------------------------
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing['2xl'],
    gap: spacing['2xl'],
  },

  // --- Profile strength card ----------------------------------------------
  strengthCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  strengthIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthTitleBlock: {
    flex: 1,
    gap: 2,
  },
  strengthTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  strengthHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  strengthPercent: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: fonts.clashDisplay.semibold,
  },
  strengthTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  strengthCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  strengthCtaText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  // --- Menu ---------------------------------------------------------------
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
  },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...getShadowStyle('xs'),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Inset to clear the 40px icon chip + its 12px gap, so the rule starts
  // under the label rather than cutting the whole card in half.
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 40 + spacing.md,
  },

  // --- Logout -------------------------------------------------------------
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: -spacing.md,
  },
});
