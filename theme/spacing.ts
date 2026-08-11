// Spacing scale (4px base unit). Values marked "confirmed" were measured
// directly from the Influsis Figma file (Foundations -> Colors layout
// gaps/padding: 8, 16, 20, 24, 64, 80, 96, 128). The remaining steps
// extend the same 4px-based progression to cover common UI needs.
// See docs/design-system.md for details.
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8, // confirmed
  md: 12,
  lg: 16, // confirmed
  xl: 20, // confirmed
  '2xl': 24, // confirmed
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64, // confirmed
  '7xl': 80, // confirmed
  '8xl': 96, // confirmed
  '9xl': 128, // confirmed
} as const;

export type SpacingToken = keyof typeof spacing;
