import { StyleSheet } from 'react-native';
import { fonts } from '@/theme';

// Shared text shapes for the onboarding/auth scenes. Figma specifies Roboto
// (body) and Righteous (intro wordmark) for this flow, neither of which is
// bundled - headings use the project's bundled ClashDisplay brand face
// instead (see docs/screen/auth/README.md "Fonts"). Distinct from
// `theme/fonts.ts`'s `typography` scale, which follows a different type
// system not used by these screens' literal Figma sizes.
export const textStyle = StyleSheet.create({
  // "Sign In" / "Sign Up" / "Welcome to Influsis" style headings.
  authHeading: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  // "Don't have an account?" / "Have an account?" footer prefix.
  footerText: {
    fontSize: 16,
  },
  // The bold, brand-colored "Sign Up" / "Sign In" footer link itself.
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
