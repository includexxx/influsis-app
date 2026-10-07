import { StyleSheet } from 'react-native';
import { fonts, getShadowStyle, palette, radius, spacing } from '@/theme';

// Campaign Details (scenes/campaigns/CampaignDetails.tsx) and its pieces in
// scenes/campaigns/components/details. Theme-dependent colors are applied
// inline; everything here is shape and type.

export const COVER_HEIGHT = 340;
// How far the content sheet's rounded top is pulled up over the cover.
export const SHEET_OVERLAP = 28;

export const campaignDetailsStyle = StyleSheet.create({
  root: { flex: 1 },
  pressed: { opacity: 0.85 },
  // Paints the cover's dark base above the content so an iOS overscroll
  // bounce doesn't reveal a white strip over the photo.
  overscrollCap: {
    position: 'absolute',
    top: -600,
    left: 0,
    right: 0,
    height: 600,
    backgroundColor: palette.gray[800],
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  errorContent: {
    paddingHorizontal: spacing.lg,
  },

  // --- Cover --------------------------------------------------------------
  cover: {
    height: COVER_HEIGHT,
    backgroundColor: palette.gray[800],
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  coverTopBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  coverBottom: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: SHEET_OVERLAP + spacing.xl,
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  glassPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  glassPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.white,
  },
  coverTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.clashDisplay.semibold,
    color: palette.white,
  },
  coverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // --- Content sheet ------------------------------------------------------
  sheet: {
    marginTop: -SHEET_OVERLAP,
    borderTopLeftRadius: SHEET_OVERLAP,
    borderTopRightRadius: SHEET_OVERLAP,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },

  // --- Business row -------------------------------------------------------
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  businessText: {
    flex: 1,
    gap: 2,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessName: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  verifiedIcon: {
    width: 18,
    height: 18,
  },
  businessMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  businessLink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Budget card --------------------------------------------------------
  budgetCard: {
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.xs,
    overflow: 'hidden',
    ...getShadowStyle('md'),
  },
  budgetGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  budgetGlowSmall: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  budgetEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  budgetAmount: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: fonts.clashDisplay.semibold,
    color: palette.white,
  },
  budgetChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  budgetChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.white,
  },

  // --- Fact tiles ---------------------------------------------------------
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  factTile: {
    // Two per row: half the row minus half the gap.
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  factIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  factLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  factValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  factBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  factBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },

  // --- Section cards ------------------------------------------------------
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  countChip: {
    minWidth: 26,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  // Justified: descriptions run to several lines, and a straight right
  // edge reads cleaner in a card.
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  readMore: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  checkList: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'justify',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  audienceGroup: {
    gap: spacing.sm,
  },
  audienceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // --- Deliverables -------------------------------------------------------
  deliverableGrid: {
    gap: spacing.sm,
  },
  deliverableTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  deliverableIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverableText: {
    flex: 1,
    gap: 1,
  },
  deliverableTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  deliverableMeta: {
    fontSize: 13,
    lineHeight: 18,
  },

  // --- Apply bar ----------------------------------------------------------
  applyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    ...getShadowStyle('lg'),
  },
  applyPriceBlock: {
    flex: 1,
    gap: 1,
  },
  applyPriceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  applyPrice: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.clashDisplay.semibold,
  },
  applyButton: {
    height: 52,
    minWidth: 160,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  applyButtonFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  applyButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
});
