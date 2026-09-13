import { StyleSheet } from 'react-native';
import { palette, radius, spacing } from '@/theme';

// Shared fragments for the three "Withdraw to Bank" screens - the bank
// directory (scenes/main/WithdrawBank.tsx, Figma node 6212:7623), the
// account-number step (scenes/main/WithdrawBankAccount.tsx, node
// 6212:7801) and the OTP step (scenes/main/WithdrawBankVerify.tsx, node
// 6212:7849). The first two share a heading + bordered-field rhythm; the
// last two share the bottom-pinned CTA.
//
// Figma draws this flow's borders as raw black alphas (`rgba(0,0,0,0.15)`
// on the search field, `rgba(0,0,0,0.1)` on the panels) rather than any
// `palette` step, so they are used verbatim.
export const withdrawBankStyle = StyleSheet.create({
  headerRow: {
    paddingBottom: spacing['2xl'],
  },
  // Bottom-pinned CTA bar, outside the ScrollView so it stays put while the
  // bank list scrolls behind it. The button itself is the existing
  // `buttonStyle.primary`, whose 54px height, 12px radius and
  // `primary[400]` fill already match Figma's "Continue Button" exactly.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.gray[900],
  },
  // The 398x46 bank search field, and the same shape reused on the next
  // screen to show the bank that was picked (node 6245:5635).
  searchField: {
    marginTop: spacing.md,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  searchInput: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[900],
    padding: 0,
  },
  listLabel: {
    marginTop: spacing['2xl'],
  },
  // The "All Banks" panel. Figma fixes it at 556px tall with the list
  // clipped inside; here it grows to fit and the page scrolls instead, so
  // every bank stays reachable on a short device.
  listPanel: {
    marginTop: spacing.md,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[300],
  },
  // Account-number step.
  accountField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 53,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 14,
    gap: spacing.md,
  },
  accountFieldIcon: {
    width: 20,
    height: 20,
  },
  accountFieldInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    padding: 0,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: spacing.lg,
    padding: 17,
    borderRadius: radius.md,
    backgroundColor: palette.primary[50],
  },
  hintIcon: {
    width: 32,
    height: 32,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  footnote: {
    marginTop: spacing.lg,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  footnoteStrong: {
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.8)',
  },
  // OTP step. Figma centers a larger 42x30 logo + 18px name lockup above
  // the code boxes (node 6212:7887) rather than reusing the 30x30/14px
  // directory row.
  verifyBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    // Figma drops this lockup well below the header (frame y=215 against a
    // header that ends at y=93) - the screen is otherwise empty above the
    // code boxes.
    marginTop: 122,
    gap: spacing.lg,
  },
  verifyBankLogo: {
    width: 42,
    height: 30,
  },
  verifyBankName: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '500',
    color: '#313131',
  },
  // Figma insets the four boxes 32px from its 430-wide artboard, 16px more
  // than the page's own gutter. That extra inset is dropped: `OtpInput`'s
  // boxes are a fixed 86px wide (four of them plus gaps need 365px), so on
  // a real 375-414pt device the row already needs the full gutter - the
  // same width the auth flow's verify-otp screen gives it.
  otpInput: {
    marginTop: 29,
  },
  resendText: {
    marginTop: spacing['2xl'],
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  resendLink: {
    fontWeight: '500',
    color: '#0B0B0B',
  },
});
