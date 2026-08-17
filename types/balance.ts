import { ImageSourcePropType } from 'react-native';

// Types for the Balance screen (Figma "Balance", node 6402:5295).
// See docs/screen/balance/README.md.

// The headline numbers on the pink hero card and the two gray tiles beneath
// it. `changeDirection` drives which way the delta pill's arrow points -
// Figma only draws the "up" state, but the value is a delta so the down
// case has to exist.
export interface BalanceSummary {
  total: string;
  change: string;
  changeDirection: 'up' | 'down';
  monthlyEarning: string;
  totalEarning: string;
}

// A row in the "Payment Method" section - a 30px 3D glyph, a title, a
// one-line description and a trailing chevron on a rounded tile.
//
// `href` is optional because only some of these rows have a destination
// that exists yet: Figma gives every row a chevron, but the payout-rail
// screens behind the first three aren't built. A row without one just
// takes the pressed state.
export interface PaymentMethodOption {
  id: string;
  icon: ImageSourcePropType;
  title: string;
  description: string;
  href?: string;
}
