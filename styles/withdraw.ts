import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// Shared fragments for the Mobile Banking flow - the Withdraw Method
// picker (scenes/main/WithdrawMethod.tsx, Figma node 6212:7700), the bKash
// checkout hand-off (scenes/main/WithdrawBkash.tsx, node 6212:7767), the
// amount step (scenes/main/WithdrawAmount.tsx, node 6212:7543) and the
// review step (scenes/main/WithdrawReview.tsx, node 6212:7574).
//
// Every one of these screens pins the same 398x54 CTA at the bottom of the
// frame (Figma y=826 of a 932-tall artboard). The button itself is the
// existing `buttonStyle.primary`, whose 54px height, 12px radius and
// `primary[400]` fill already match Figma's "Continue Button" exactly.
export const withdrawStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: 18,
  },
  // Bottom-pinned CTA bar, outside the ScrollView so it stays put while
  // the method list scrolls behind it.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  // Figma spaces the picker's five rows 16px apart.
  methodList: {
    gap: spacing.lg,
  },
  // "Withdraw amount" / "Payment method" / "Review" section headings.
  sectionTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    color: palette.gray[900],
  },
  // Amount step: the bare 398x54 input under the heading (node 6212:7972).
  // Figma draws it completely empty - no placeholder, no currency prefix.
  amountFieldWrap: {
    marginTop: spacing.md,
  },
  amountFieldRow: {
    height: 54,
    borderRadius: radius.lg,
    borderColor: palette.gray[200],
    paddingVertical: 0,
  },
  amountFieldInput: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Review step.
  savedMethodCard: {
    marginTop: spacing.md,
  },
  changeMethodLink: {
    marginTop: spacing.lg,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: palette.gray[300],
  },
  reviewTitle: {
    marginTop: spacing.lg,
  },
  reviewRow: {
    marginTop: spacing.sm,
  },
  termsText: {
    marginTop: spacing.lg,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(29, 29, 29, 0.5)',
  },
  // Figma darkens only the "Terms and Conditions" half of that sentence.
  termsLink: {
    color: '#1D1D1D',
  },
  // bKash hand-off: Figma flattens the provider's own checkout card into a
  // single 300x513 bitmap (node 6212:7796) and overlays just the payer row
  // on top of it, so it is reproduced the same way here rather than rebuilt
  // out of primitives we have no vector source for.
  bkashCard: {
    alignSelf: 'center',
    width: 300,
    height: 513,
    marginTop: spacing.lg,
  },
  bkashCardImage: {
    width: '100%',
    height: '100%',
  },
  // Figma's own offsets for the payer row inside that card (+11, +70).
  bkashPayerRow: {
    position: 'absolute',
    left: 11,
    top: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bkashPayerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  bkashPayerName: {
    fontSize: 16,
    letterSpacing: -0.48,
    color: '#444444',
  },
});
