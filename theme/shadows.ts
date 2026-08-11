import { Platform } from 'react-native';

// Elevation/shadow scale. `sm` is the one shadow token defined in the
// Influsis Figma file ("Shadow/sm"): two stacked drop shadows —
//   0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)
// React Native has no native multi-layer shadow, so `sm` below uses the
// more visible second layer for iOS/web and an equivalent `elevation`
// for Android. `xs`/`md`/`lg` extrapolate the same style for elements
// that need more/less depth than `sm`. See docs/design-system.md.
type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
  boxShadow?: string; // used on web (react-native-web)
};

function makeShadow(
  offsetY: number,
  blurRadius: number,
  opacity: number,
  elevation: number,
): ShadowToken {
  return {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blurRadius,
    elevation,
    boxShadow: `0px ${offsetY}px ${blurRadius}px rgba(16, 24, 40, ${opacity})`,
  };
}

export const shadows = {
  none: makeShadow(0, 0, 0, 0),
  xs: makeShadow(1, 2, 0.05, 1),
  sm: makeShadow(1, 3, 0.1, 2), // confirmed (Shadow/sm)
  md: makeShadow(4, 8, 0.1, 4),
  lg: makeShadow(8, 16, 0.12, 8),
} as const;

export type ShadowScaleToken = keyof typeof shadows;

// Convenience: pass a token's style straight to a View's `style` prop.
// On Android only `elevation` renders shadows; the rest are ignored.
export function getShadowStyle(token: ShadowScaleToken) {
  const shadow = shadows[token];
  return Platform.OS === 'web' ? { boxShadow: shadow.boxShadow } : shadow;
}
