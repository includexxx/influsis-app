import { StyleSheet } from 'react-native';
import { palette } from '@/theme';

// Shared "hero photo" frame - a white-bordered rounded card sitting in
// front of a rotated photo collage. Used by the sign-in landing collage and
// onboarding slide 3's card stack; each call site merges in its own
// width/height since those differ per screen.
export const cardStyle = StyleSheet.create({
  heroFrame: {
    borderRadius: 20,
    borderWidth: 6,
    borderColor: palette.white,
  },
});
