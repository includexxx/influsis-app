import { palette } from '@/theme';

// Accent tones for the Profile tab's icon chips. On white paper a chip is a
// 50-step tint behind a 600-step glyph; on the dark theme's near-black cards
// those tints glare, so the chip becomes a low-alpha wash of the accent and
// the glyph moves to a lighter step.
export type AccentTone = 'primary' | 'navy' | 'success' | 'warning' | 'error';

const TONES: Record<AccentTone, { light: ToneColors; dark: ToneColors }> = {
  primary: {
    light: { background: palette.primary[50], foreground: palette.primary[500] },
    dark: { background: 'rgba(244, 46, 158, 0.18)', foreground: palette.primary[300] },
  },
  navy: {
    light: { background: palette.primaryNavy[50], foreground: palette.primaryNavy[800] },
    dark: { background: 'rgba(239, 239, 253, 0.12)', foreground: palette.primaryNavy[50] },
  },
  success: {
    light: { background: palette.success[50], foreground: palette.success[600] },
    dark: { background: 'rgba(50, 213, 131, 0.16)', foreground: palette.success[300] },
  },
  warning: {
    light: { background: palette.warning[50], foreground: palette.warning[600] },
    dark: { background: 'rgba(253, 176, 34, 0.16)', foreground: palette.warning[300] },
  },
  error: {
    light: { background: palette.error[50], foreground: palette.error[600] },
    dark: { background: 'rgba(249, 112, 102, 0.16)', foreground: palette.error[300] },
  },
};

export interface ToneColors {
  background: string;
  foreground: string;
}

export function toneColors(tone: AccentTone, isDark: boolean): ToneColors {
  return isDark ? TONES[tone].dark : TONES[tone].light;
}
