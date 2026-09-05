// Border radius scale. `sm` and `md` were measured directly from the
// Influsis Figma file (color swatch cards use 8px, small chips use 4px).
// `lg`/`xl`/`full` extend the scale for larger cards and pill/circular
// elements. See docs/design-system.md for details.
export const radius = {
  none: 0,
  sm: 4, // confirmed
  md: 8, // confirmed
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
