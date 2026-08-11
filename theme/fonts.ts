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
  // Influsis brand display face (confirmed via the influsis-frontend web
  // project, which already uses ClashDisplay for headings).
  clashDisplay: {
    extralight: 'clashDisplay_extralight',
    light: 'clashDisplay_light',
    regular: 'clashDisplay_regular',
    medium: 'clashDisplay_medium',
    semibold: 'clashDisplay_semibold',
    bold: 'clashDisplay_bold',
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
    clashDisplay_extralight: require('@/assets/fonts/ClashDisplay/ClashDisplay-Extralight.otf'),
    clashDisplay_light: require('@/assets/fonts/ClashDisplay/ClashDisplay-Light.otf'),
    clashDisplay_regular: require('@/assets/fonts/ClashDisplay/ClashDisplay-Regular.otf'),
    clashDisplay_medium: require('@/assets/fonts/ClashDisplay/ClashDisplay-Medium.otf'),
    clashDisplay_semibold: require('@/assets/fonts/ClashDisplay/ClashDisplay-Semibold.otf'),
    clashDisplay_bold: require('@/assets/fonts/ClashDisplay/ClashDisplay-Bold.otf'),
  });

// Font families used by the Influsis Figma design system. `inter` and
// `publicSans` are NOT bundled as assets yet — until .ttf files are added
// to assets/fonts and registered in loadFonts(), text using them will
// silently fall back to the platform's system font. `clashDisplay` and
// `openSans` ARE bundled (see `fonts` above and `loadFonts()`).
// See docs/design-system.md ("Typography" > "Known gaps").
export const fontFamilies = {
  inter: 'Inter',
  publicSans: 'Public Sans',
  openSans: 'Open Sans',
  clashDisplay: 'ClashDisplay',
} as const;

// Named text styles from the Figma "Foundations -> Typography" scale.
// Usage: <Text style={typography.displayXl}>...</Text>
//
// Display-tier styles use the bundled ClashDisplay weight-specific font
// family names directly (not `fontFamily` + `fontWeight`, since expo-font
// registers each weight as its own family — see `fonts.clashDisplay`).
// This substitutes the Figma page's literal Inter/Public Sans display
// styles with the confirmed brand display face; Text-tier styles are
// left as Inter/Public Sans (unbundled, still a known gap).
export const typography = {
  displayXl: {
    fontFamily: fonts.clashDisplay.semibold,
    fontSize: 60,
    lineHeight: 72,
    letterSpacing: -2,
  },
  displayM: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  displayS: {
    fontFamily: fonts.clashDisplay.medium,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
  displayXsRegular: {
    fontFamily: fonts.clashDisplay.regular,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  displayXsMedium: {
    fontFamily: fonts.clashDisplay.medium,
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
