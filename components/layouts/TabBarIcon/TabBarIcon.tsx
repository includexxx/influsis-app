import { View, StyleSheet } from 'react-native';
import Image from '@/components/elements/Image';

const homeActive = require('@/assets/images/tab-bar/home-active.png');
const homeInactive = require('@/assets/images/tab-bar/home-inactive.png');
const orderActiveBase = require('@/assets/images/tab-bar/order-active-base.png');
const orderActiveAccent1 = require('@/assets/images/tab-bar/order-active-accent1.png');
const orderActiveAccent2 = require('@/assets/images/tab-bar/order-active-accent2.png');
const orderInactive = require('@/assets/images/tab-bar/order-inactive.png');
const messageActive = require('@/assets/images/tab-bar/message-active.png');
const messageInactive = require('@/assets/images/tab-bar/message-inactive.png');
const profileActive1 = require('@/assets/images/tab-bar/profile-active-1.png');
const profileActive2 = require('@/assets/images/tab-bar/profile-active-2.png');
const profileInactive = require('@/assets/images/tab-bar/profile-inactive.png');
const createGigIcon = require('@/assets/images/tab-bar/create-gig.png');

export type TabBarIconName = 'home' | 'order' | 'message' | 'profile' | 'create-gig';

export interface TabBarIconProps {
  name: TabBarIconName;
  focused: boolean;
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
  },
  createGigBox: {
    width: 27,
    height: 27,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  // Figma insets (within the 24px icon box) for the two small accent marks
  // layered onto the Order tab's active-state icon (node 6355:6659/6660).
  orderAccent1: {
    position: 'absolute',
    top: 3,
    left: 2.84,
    width: 18.33,
    height: 3.67,
  },
  orderAccent2: {
    position: 'absolute',
    top: 10,
    left: 9,
    width: 6.42,
    height: 7.38,
  },
});

// Bottom tab bar icons (Figma "TabBar", node 6355:6595). Home and Message
// are simple active/inactive image swaps; Order and Profile's active states
// layer multiple exported layers on top of a base glyph, matching Figma's
// own layer structure rather than being pre-flattened images. Create Gig
// has no active state - it's an action button, not a persisted tab (Figma's
// four `property1` variants never include one for it).
function TabBarIcon({ name, focused }: TabBarIconProps) {
  if (name === 'home') {
    return (
      <Image source={focused ? homeActive : homeInactive} style={styles.box} contentFit="contain" />
    );
  }

  if (name === 'message') {
    return (
      <Image
        source={focused ? messageActive : messageInactive}
        style={styles.box}
        contentFit="contain"
      />
    );
  }

  if (name === 'order') {
    if (!focused) {
      return <Image source={orderInactive} style={styles.box} contentFit="contain" />;
    }
    return (
      <View style={styles.box}>
        <Image source={orderActiveBase} style={styles.fill} contentFit="contain" />
        <Image source={orderActiveAccent1} style={styles.orderAccent1} contentFit="contain" />
        <Image source={orderActiveAccent2} style={styles.orderAccent2} contentFit="contain" />
      </View>
    );
  }

  if (name === 'profile') {
    if (!focused) {
      return <Image source={profileInactive} style={styles.box} contentFit="contain" />;
    }
    return (
      <View style={styles.box}>
        <Image source={profileActive1} style={styles.fill} contentFit="contain" />
        <Image source={profileActive2} style={styles.fill} contentFit="contain" />
      </View>
    );
  }

  return <Image source={createGigIcon} style={styles.createGigBox} contentFit="contain" />;
}

export default TabBarIcon;
