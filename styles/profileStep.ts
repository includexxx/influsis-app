import { StyleSheet } from 'react-native';

// Shared fragments for the profile-verification scenes
// (scenes/profile-verification/*), reused directly across the six wizard
// screens the same way layoutStyle/buttonStyle are reused by the auth
// scenes. Component-internal look (ProfileStepHeader, SelectableListItem,
// DateField) lives with those components instead - this file only holds
// shapes the scene files themselves assemble.
export const profileStepStyle = StyleSheet.create({
  // Vertical gap between stacked SelectableListItem rows (category/social
  // media/language screens) - 14px per Figma, not one of the standard
  // spacing scale steps.
  optionList: {
    gap: 14,
  },
  // Sizes the multiline TextInput inside a TextField (via its `inputStyle`
  // prop) into the ~208px-tall textarea box the "passion" bio screen uses.
  bioInput: {
    height: 176,
    textAlignVertical: 'top',
  },
  // "Influsis.com/" left adornment on the username field.
  usernamePrefix: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 2,
  },
  header: {
    marginBottom: 32,
  },
});
