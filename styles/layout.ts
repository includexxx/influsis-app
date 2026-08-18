import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

// Shared screen-level layout shapes, reused across the onboarding/auth
// scenes (scenes/onboarding, scenes/auth). Pair `screen` with a dynamic
// `{ backgroundColor: colors.background }` from `useTheme()` at the call
// site - background is theme-dependent, everything here is not.
export const layoutStyle = StyleSheet.create({
  // Root container for a full-screen scene (SafeAreaView/View).
  screen: {
    flex: 1,
  },
  // Horizontal/bottom padding for a ScrollView's contentContainerStyle.
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  // Vertical gap between stacked form fields.
  fieldGroup: {
    gap: spacing['sm'],
  },
});
