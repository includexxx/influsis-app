import { StyleSheet } from 'react-native';
import { palette, radius } from '@/theme';

// Shared "primary CTA" button shape used by every scene's main action
// (Sign In, Sign Up, Verify, onboarding Next/Get Started). Figma specifies
// the literal brand color `#F42E9E` (palette.primary[400]) here rather
// than the theme-adaptive `colors.primary` - see docs/screen/auth/README.md
// "Cross-cutting scope notes" - so this is fully static and doesn't need
// useTheme().
export const buttonStyle = StyleSheet.create({
  primary: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: palette.primary[400],
  },
  primaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.white,
  },
});
