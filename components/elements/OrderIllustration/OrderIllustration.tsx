import { Platform, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Image from '../Image';

const packageIcon = require('@/assets/images/order/package-icon.png');

export interface OrderIllustrationProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Same `4px 8px 16px rgba(15,23,42,0.04)` lens shadow SearchIllustration's
// `lensShadow` uses.
const lensShadow =
  Platform.OS === 'web'
    ? { boxShadow: '4px 8px 16px rgba(15, 23, 42, 0.04)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 4, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 1,
      };

const styles = StyleSheet.create({
  root: {
    width: 107,
    height: 107,
    borderRadius: 53.5,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...lensShadow,
  },
  icon: {
    width: 40,
    height: 40,
  },
  // Four decorative dots scattered around the outer circle's edge (Figma
  // "Ellipse 258-261", node 6366:6901) - same positions
  // SearchIllustration's dots use (this "Illustration" component is reused
  // across Figma with just the center icon + dot colors swapped), plain
  // colored Views rather than raster assets since they're solid circles.
  dotDark: {
    position: 'absolute',
    left: -12,
    top: 13,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
    backgroundColor: '#E58E13',
  },
  dotLight: {
    position: 'absolute',
    left: 103,
    top: 8,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
    backgroundColor: '#F7D360',
  },
  dotGray: {
    position: 'absolute',
    left: 112,
    top: 15,
    width: 6.2,
    height: 6.2,
    borderRadius: 3.1,
    backgroundColor: '#E5E7EB',
  },
  dotAccent: {
    position: 'absolute',
    left: -12,
    top: 95,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
    backgroundColor: '#FEC84B',
  },
});

// "No orders" illustration (Figma node 6366:6901, reused unchanged at node
// 6574:6440 for the "Gig order" tab's empty state) used by the Order
// screen's empty tabs, paired with EmptyState for the title/description. A
// package glyph centered in a white circle ("lens"), inside a light gray
// disc with four scattered decorative dots - the same structure
// SearchIllustration uses for the Search screen's "No results" state, with
// the megaphone icon and pink/teal dot colors swapped for a package icon
// and warning-toned dots.
function OrderIllustration({ style, testID }: OrderIllustrationProps) {
  return (
    <View style={[styles.root, style]} testID={testID}>
      <View style={styles.dotDark} />
      <View style={styles.dotLight} />
      <View style={styles.dotGray} />
      <View style={styles.dotAccent} />
      <View style={styles.lens}>
        <Image source={packageIcon} style={styles.icon} contentFit="contain" />
      </View>
    </View>
  );
}

export default OrderIllustration;
