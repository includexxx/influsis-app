import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared fragments for the creator onboarding wizard scenes
// (scenes/creator-onboarding/*), reused directly across its step screens
// the same way layoutStyle/buttonStyle are reused by the auth scenes.
// (Named for the retired profile-verification wizard this flow replaced;
// kept as-is since the shapes are unchanged.) Component-internal look
// (ProfileStepHeader, SelectableRow, DateField) lives with those
// components instead - this file only holds shapes the scene files
// themselves assemble.
//
// Text styles here are shape-only (size / weight / spacing). Color is
// theme-dependent, so callers pair them with a `useTheme()` value:
//   sectionLabel -> colors.text.primary
//   helperText   -> palette.gray[300]
//   fieldError   -> colors.error
//   counter      -> palette.gray[300]
export const profileStepStyle = StyleSheet.create({
  // Canonical vertical gap between stacked fields / option rows on every
  // onboarding step. Reconciles the old `layoutStyle.fieldGroup` (spacing.sm)
  // and `optionList` (14) onto one rhythm - spacing.md (12), decided in the
  // build-plan 22 review.
  fields: {
    gap: spacing.md,
  },
  // Back-compat alias for the multi-select steps; identical to `fields`.
  optionList: {
    gap: spacing.md,
  },
  // Sizes the multiline TextInput inside a TextField (via its `inputStyle`
  // prop) into the ~208px-tall textarea box the bio screen uses.
  bioInput: {
    height: 176,
    textAlignVertical: 'top',
  },
  // Gap above the free-text "Others" input that drops in under its option row
  // on the Languages / Content Categories steps.
  otherInput: {
    marginTop: spacing.sm,
  },
  // "@" left adornment on the username field.
  usernamePrefix: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 2,
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  // Label above an option list or a grouped field (e.g. "Profile photo",
  // "Music"). Matches the shared TextField label weight/size.
  sectionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  // One-line helper / nudge text under a field or control.
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Inline validation message under a field or group.
  fieldError: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Character / item counter, right-aligned under a field.
  counter: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    fontSize: 13,
    lineHeight: 18,
  },
});
