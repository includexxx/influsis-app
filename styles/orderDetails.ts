import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// Shared fragments for the Order Details scene (scenes/main/OrderDetails.tsx,
// Figma "Order details", node 6040:8515). Unlike Campaign/Brand Details, the
// banner photo here isn't full-bleed - Figma insets it the same 16px as the
// rest of the screen's content, so the whole scene uses
// `layoutStyle.scrollContent` rather than a separate `bannerWrap`.
export const orderDetailsStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: spacing.lg,
  },
  image: {
    width: '100%',
    height: 144,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  // Figma's literal `#313131` - close to but not an exact match of any
  // `palette.gray` step, used verbatim here and on the deliverable card's
  // own title text below rather than snapped to a slightly-off token.
  priceValue: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    marginTop: 4,
    color: '#313131',
  },
  // "Order: {brand} ✓ | Delivery: {date}" meta row - marginTop normalized to
  // a single value rather than Figma's own fixed absolute gap (which
  // assumes the title wraps to exactly 2 lines, not reliable once the title
  // is real flex-wrapped text).
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  metaBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBrandValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  verifiedIcon: {
    width: 20,
    height: 20,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  metaDeliveryValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  // Deliverable card - Figma's own left/right padding is asymmetric (12px
  // left, 36px right, node 6040:8548 vs its 6040:8547 parent), read as an
  // unintentional auto-layout artifact and normalized to a single symmetric
  // value.
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing['2xl'],
    backgroundColor: palette.primary[50],
  },
  cardHeading: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    color: '#313131',
  },
  deliverableList: {
    gap: spacing.xl,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  deliverableIcon: {
    width: 20,
    height: 20,
    marginTop: 3,
  },
  deliverableTextCol: {
    flex: 1,
    gap: spacing.xs,
  },
  deliverableTitle: {
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '600',
    color: '#313131',
  },
  deliverableDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  requirementsTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  // Gap between the "Requirements" title and its bullet list - confirmed
  // from Figma's pixel positions, the same value Campaign Details'
  // `sectionHeaderGap` already uses for the identical title->content gap.
  requirementsListGap: {
    marginTop: spacing.sm,
  },
  buttonsWrap: {
    marginTop: spacing['2xl'],
  },
  messageButton: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: 'transparent',
    marginTop: spacing.sm,
  },
  messageButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.gray[900],
  },
});
