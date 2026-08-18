import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/theme';

// Shared fragments for the Privacy Policy scene
// (scenes/main/PrivacyPolicy.tsx, Figma "Privacy Policy", node 6027:8267).
//
// Presentation reworked into an elevated hero card (tinted icon chip +
// heading + intro) followed by a numbered-badge rules card, matching the
// card/chip/shadow language introduced by the Account screen redesign
// (styles/account.ts) - same content, same copy, just restyled.
export const privacyPolicyStyle = StyleSheet.create({
  headerGap: {
    marginBottom: spacing['2xl'],
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconChipImage: {
    width: 28,
    height: 28,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  rulesCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  ruleBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ruleTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  ruleLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  // Inset to clear the 32px badge + its 12px gap, so the rule starts under
  // the label rather than cutting the whole card in half.
  ruleDivider: {
    height: 1,
    marginLeft: 44,
  },
});
