// Legacy boilerplate colors — still used by the placeholder demo screens.
// New work should use `palette` / `lightTheme` / `darkTheme` below instead.
// See docs/design-system.md for the full token reference.
export const colors = {
  darkPurple: '#231d54',
  purple: '#8100ff',
  lightPurple: '#9388db',
  lightGrayPurple: '#f7f7fb',
  pink: '#ff3d69',
  gray: '#797777',
  blackGray: '#101212',
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
};

// Raw color scales extracted from the Influsis Figma design system
// (Foundations -> Colors). Source of truth for all new UI work.
export const palette = {
  primary: {
    25: '#FEF1F9',
    50: '#FDE6F5',
    100: '#FDCDEB',
    200: '#FDA4DA',
    300: '#FB6BC0',
    400: '#F42E9E',
    500: '#E51D84', // base
    600: '#C70F68',
    700: '#A41057',
    800: '#89124B',
    900: '#540329',
  },
  // Distinct navy accent scale used alongside the primary magenta
  // (named "Primary/Primary-*" in Figma). Only 50/800 are defined there.
  primaryNavy: {
    50: '#EFEFFD',
    800: '#17163A',
  },
  secondary: {
    25: '#EEFFF4',
    50: '#D7FFE8',
    100: '#B2FFD2',
    200: '#76FFB2',
    300: '#2EF484',
    400: '#09DE67', // base
    500: '#01B851',
    600: '#059043',
    700: '#0A7138',
    800: '#0B5C31',
    900: '#003419',
  },
  gray: {
    25: '#F4F4F4',
    50: '#E9E9EA',
    100: '#D2D2D5',
    200: '#A5A5AB',
    300: '#777980',
    400: '#4A4C56',
    500: '#1D1F2C',
    600: '#161721',
    700: '#0F1016',
    800: '#07080B',
    900: '#030304',
  },
  error: {
    25: '#FFFBFA',
    50: '#FEF3F2',
    100: '#FEE4E2',
    200: '#FECDCA',
    300: '#FDA29B',
    400: '#F97066',
    500: '#F04438', // base
    600: '#D92D20',
    700: '#B42318',
    800: '#912018',
    900: '#7A271A',
  },
  warning: {
    25: '#FFFCF5',
    50: '#FFFAEB',
    100: '#FEF0C7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009', // base
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#7A2E0E',
  },
  success: {
    25: '#F6FEF9',
    50: '#ECFDF3',
    100: '#D1FADF',
    200: '#A6F4C5',
    300: '#6CE9A6',
    400: '#32D583',
    500: '#12B76A', // base
    600: '#039855',
    700: '#027A48',
    800: '#05603A',
    900: '#054F31',
  },
  // Secondary neutral scale used for borders/dividers — only partially
  // exposed on the Figma Colors page (25/50/100 confirmed).
  neutralGray: {
    50: '#F0F1F3',
    100: '#E0E2E7',
    200: '#C2C6CE',
  },
  // Neutral text/icon variants — only partially exposed on the Figma
  // Colors page (confirmed values below).
  neutralBlack: {
    light: '#504D55',
    600: '#4D5464',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Semantic tokens — what screens/components should actually read from.
// Maps design intent (background, text, border, ...) to the raw palette
// above, per color scheme.
export type Theme = {
  background: string;
  surface: string;
  card: string;
  border: string;
  divider: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  error: string;
  warning: string;
  success: string;
  overlay: string;
};

export const lightTheme: Theme = {
  background: palette.white,
  surface: palette.gray[25],
  card: palette.white,
  border: palette.neutralGray[100],
  divider: palette.gray[50],
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[400],
    disabled: palette.gray[200],
    inverse: palette.white,
  },
  primary: palette.primary[500],
  onPrimary: palette.white,
  secondary: palette.secondary[500],
  onSecondary: palette.white,
  error: palette.error[500],
  warning: palette.warning[500],
  success: palette.success[500],
  overlay: 'rgba(3, 3, 4, 0.5)',
};

export const darkTheme: Theme = {
  background: palette.gray[900],
  surface: palette.gray[800],
  card: palette.gray[800],
  border: palette.gray[700],
  divider: palette.gray[700],
  text: {
    primary: palette.white,
    secondary: palette.gray[200],
    disabled: palette.gray[500],
    inverse: palette.gray[900],
  },
  primary: palette.primary[400],
  onPrimary: palette.primaryNavy[800],
  secondary: palette.secondary[400],
  onSecondary: palette.gray[900],
  error: palette.error[400],
  warning: palette.warning[400],
  success: palette.success[400],
  overlay: 'rgba(3, 3, 4, 0.7)',
};
