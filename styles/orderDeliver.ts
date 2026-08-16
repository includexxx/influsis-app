import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// Shared fragments for the Order Deliver scene (scenes/main/OrderDeliver.tsx,
// Figma "Order Deliver" - nodes 6040:8590/6574:6219 for the "Order Activity"
// tab (empty/filled link field), 6040:8664 for the in-place "Order Details"
// tab).
export const orderDeliverStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: 14,
  },
  // Full-width hairline beneath the header (Figma "Line 9", `#EDEDED`).
  divider: {
    height: 1,
    backgroundColor: '#EDEDED',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 13,
  },
  // Each tab gets its own bottom border rather than one shared
  // absolutely-positioned indicator spanning a computed width - simpler and
  // robust for a tab that can now be either one active (see
  // OrderDeliver.tsx's `activeTab` state), at the cost of the hairline not
  // visibly continuing through the gap between the two tabs the way
  // Figma's single full-width "Line 9" + overlaid "Line 11" does.
  tabItem: {
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#EDEDED',
  },
  tabItemActive: {
    borderBottomColor: palette.primary[400],
  },
  tabActiveLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.gray[900],
  },
  tabInactiveLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.gray[300],
  },
  // "Order Activity" tab content.
  activityList: {
    marginTop: 16,
    gap: 24,
  },
  inputWrap: {
    marginTop: 24,
  },
  // Overrides TextField's default 12px radius/`gray[100]` border/16px
  // vertical padding with this screen's own 8px radius, `rgba(0,0,0,0.2)`
  // border and fixed 48px height (via TextField's new `inputRowStyle` prop).
  inputRow: {
    height: 48,
    borderRadius: radius.md,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 0,
  },
  clipIcon: {
    width: 16,
    height: 16,
  },
  // Figma's own `#F42E9E`/8px-radius/52px-tall button - a different shape
  // than `buttonStyle.primary` (12px radius, 54px tall), used verbatim as
  // this screen's own literal rather than reusing the shared token and
  // introducing a visible size mismatch with Figma.
  deliveryButton: {
    marginTop: 24,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.primary[400],
  },
  deliveryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  // "Order Details" tab content (Figma node 6040:8664). Unlike the pink
  // "Order Tracker" card below, the summary block sits on a plain
  // background - Figma's own wrapping frame (node 6040:8696) has no fill.
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.gray[900],
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 16,
  },
  summaryImage: {
    width: 127,
    height: 92,
    borderRadius: radius.md,
  },
  summaryTextCol: {
    flex: 1,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.gray[900],
  },
  metaList: {
    marginTop: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 16,
    color: palette.gray[300],
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.gray[900],
    textAlign: 'right',
  },
  trackerCard: {
    marginTop: spacing['2xl'],
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: palette.primary[50],
  },
  trackerHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.gray[900],
    marginBottom: 16,
  },
});
