import {
  darkTheme,
  lightTheme,
  palette,
  radius,
  shadows,
  spacing,
  typography,
  Theme,
} from '@/theme';
import useColorScheme from './useColorScheme';

export type UseThemeResult = {
  colors: Theme;
  palette: typeof palette;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  isDark: boolean;
};

// Single entry point for the design system: resolves semantic colors for
// the active light/dark scheme and bundles them with the rest of the
// design tokens. Prefer this over importing `lightTheme`/`darkTheme`
// directly in components.
export default function useTheme(): UseThemeResult {
  const { isDark } = useColorScheme();
  return {
    colors: isDark ? darkTheme : lightTheme,
    palette,
    spacing,
    radius,
    shadows,
    typography,
    isDark,
  };
}
