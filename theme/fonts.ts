import { loadAsync } from 'expo-font';

export const fonts = {
  openSan: {
    regular: 'openSans_regular',
    regularItalic: 'openSans_regular_italic',
    semiBold: 'openSans_semiBold',
    semiBoldItalic: 'openSans_semiBold_italic',
    bold: 'openSans_bold',
    boldItalic: 'openSans_bold_italic',
  },
};

// preload fonts
export const loadFonts = () =>
  loadAsync({
    openSans_regular: require('@/assets/fonts/OpenSans-Regular.ttf'),
    openSans_regular_italic: require('@/assets/fonts/OpenSans-Italic.ttf'),
    openSans_semiBold: require('@/assets/fonts/OpenSans-Semibold.ttf'),
    openSans_semiBold_italic: require('@/assets/fonts/OpenSans-SemiboldItalic.ttf'),
    openSans_bold: require('@/assets/fonts/OpenSans-Bold.ttf'),
    openSans_bold_italic: require('@/assets/fonts/OpenSans-BoldItalic.ttf'),
  });

// Font families used by the Influsis Figma design system. These are NOT
// bundled as assets yet (only Open Sans is, above) — until Inter and
// Public Sans .ttf files are added to assets/fonts and registered in
// loadFonts(), these will silently fall back to the platform's system
// font. See docs/design-system.md ("Typography" > "Known gaps").
export const fontFamilies = {
  inter: 'Inter',
  publicSans: 'Public Sans',
  openSans: 'Open Sans',
} as const;

// Named text styles from the Figma "Foundations -> Typography" scale.
// Usage: <Text style={typography.displayXl}>...</Text>
export const typography = {
  displayXl: {
    fontFamily: fontFamilies.inter,
    fontWeight: '600' as const,
    fontSize: 60,
    lineHeight: 72,
    letterSpacing: -2,
  },
  displayM: {
    fontFamily: fontFamilies.publicSans,
    fontWeight: '700' as const,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  displayS: {
    fontFamily: fontFamilies.publicSans,
    fontWeight: '500' as const,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
  displayXsRegular: {
    fontFamily: fontFamilies.inter,
    fontWeight: '400' as const,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  displayXsMedium: {
    fontFamily: fontFamilies.inter,
    fontWeight: '500' as const,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  textXl: {
    fontFamily: fontFamilies.inter,
    fontWeight: '400' as const,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0,
  },
  textXlUnderlined: {
    fontFamily: fontFamilies.inter,
    fontWeight: '400' as const,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0,
    textDecorationLine: 'underline' as const,
  },
  textLMedium: {
    fontFamily: fontFamilies.publicSans,
    fontWeight: '500' as const,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  textLSemibold: {
    fontFamily: fontFamilies.publicSans,
    fontWeight: '600' as const,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
} as const;
