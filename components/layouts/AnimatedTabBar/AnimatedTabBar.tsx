import { ComponentProps, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks';
import { palette } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface TabConfig {
  /** The route name inside app/(main). */
  name: string;
  label: string;
  icon: FeatherName;
}

// The visible tabs, in order. Routes not listed here (search, ballance) stay
// registered in the shell but get no tab button.
export const MAIN_TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'order', label: 'Order', icon: 'shopping-bag' },
  { name: 'create', label: 'Create Gig', icon: 'plus-square' },
  { name: 'message', label: 'Message', icon: 'message-circle' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

// Geometry (px, relative to the bar's top edge). The active tab's circle sits
// half above the bar; a larger cut-out circle around it carves the notch, and
// two rounded "shoulders" smooth where the notch meets the flat top edge.
const BAR_HEIGHT = 70;
const ICON_CENTER_Y = 34;
const CIRCLE_SIZE = 52;
const CIRCLE_CENTER_Y = 12;
const NOTCH_RADIUS = 34;
const SHOULDER = 10;
// Where the notch circle crosses the bar's top edge, from its center.
const NOTCH_HALF_OPENING = Math.sqrt(NOTCH_RADIUS ** 2 - CIRCLE_CENTER_Y ** 2);
const GROUP_WIDTH = (NOTCH_HALF_OPENING + SHOULDER) * 2;
const LABEL_TOP = CIRCLE_CENTER_Y + CIRCLE_SIZE / 2 + 4;

const SLIDE = { damping: 20, stiffness: 200, mass: 0.7 };
const POP = { damping: 9, stiffness: 260, mass: 0.6 };

const styles = StyleSheet.create({
  bar: { overflow: 'visible' },
  row: { height: BAR_HEIGHT, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center' },
  inactiveIcon: { position: 'absolute', top: ICON_CENTER_Y - 12 },
  group: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: GROUP_WIDTH,
    height: BAR_HEIGHT,
  },
  // Clips the cut-out circle to the bar, so nothing is painted over the
  // screen above it.
  notchClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: GROUP_WIDTH,
    height: BAR_HEIGHT,
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    top: CIRCLE_CENTER_Y - NOTCH_RADIUS,
    left: GROUP_WIDTH / 2 - NOTCH_RADIUS,
    width: NOTCH_RADIUS * 2,
    height: NOTCH_RADIUS * 2,
    borderRadius: NOTCH_RADIUS,
  },
  shoulder: { position: 'absolute', top: 0, width: SHOULDER, height: SHOULDER },
  shoulderLeft: { left: 0 },
  shoulderRight: { right: 0 },
  shoulderFill: { flex: 1 },
  circle: {
    position: 'absolute',
    top: CIRCLE_CENTER_Y - CIRCLE_SIZE / 2,
    left: GROUP_WIDTH / 2 - CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary[500],
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 14px rgba(229, 29, 132, 0.35)' }
      : {
          shadowColor: palette.primary[500],
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        }),
  },
  label: {
    position: 'absolute',
    top: LABEL_TOP,
    left: -12,
    width: GROUP_WIDTH + 24,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

function tapFeedback() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

// The main shell's bottom navigation (app/(main)/_layout.tsx), replacing
// React Navigation's default bar with a notched design: inactive tabs are
// plain icons on a soft surface; the active tab rises into a brand-pink
// circle sitting in a curved notch, with its label underneath. On a tab
// change the notch and circle spring across to the new tab and the circle
// pops in with a small zoom. Tab presses go through React Navigation's
// `tabPress` event, so per-screen listeners can still prevent a switch.
function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);

  const tabs = MAIN_TABS.filter(tab => state.routes.some(route => route.name === tab.name));
  const focusedName = state.routes[state.index]?.name;
  const focusedIndex = tabs.findIndex(tab => tab.name === focusedName);
  const focusedTab = focusedIndex >= 0 ? tabs[focusedIndex] : null;
  const tabWidth = tabs.length ? rowWidth / tabs.length : 0;
  const ready = rowWidth > 0;

  const groupX = useSharedValue(0);
  const groupOpacity = useSharedValue(0);
  const circleScale = useSharedValue(1);
  const placed = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (focusedIndex < 0) {
      groupOpacity.value = withTiming(0, { duration: 150 });
      placed.current = false;
      return;
    }
    const target = focusedIndex * tabWidth + tabWidth / 2 - GROUP_WIDTH / 2;
    if (!placed.current) {
      // First placement: jump there, no slide.
      groupX.value = target;
      placed.current = true;
    } else {
      groupX.value = withSpring(target, SLIDE);
      // Small zoom: dip, then spring back past 1 and settle.
      circleScale.value = withSequence(withTiming(0.8, { duration: 90 }), withSpring(1, POP));
    }
    groupOpacity.value = withTiming(1, { duration: 150 });
  }, [focusedIndex, tabWidth, ready, groupX, groupOpacity, circleScale]);

  const groupStyle = useAnimatedStyle(() => ({
    opacity: groupOpacity.value,
    transform: [{ translateX: groupX.value }],
  }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  function onLayout(event: LayoutChangeEvent) {
    setRowWidth(event.nativeEvent.layout.width);
  }

  function press(route: (typeof state.routes)[number]) {
    tapFeedback();
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (route.name !== focusedName && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }

  const barColor = colors.surface;

  return (
    <View
      style={[styles.bar, { backgroundColor: barColor, paddingBottom: insets.bottom }]}
      accessibilityRole="tablist"
      testID="main-tab-bar">
      <View style={styles.row} onLayout={onLayout} testID="main-tab-row">
        {ready && focusedTab ? (
          <Animated.View pointerEvents="none" style={[styles.group, groupStyle]}>
            <View style={styles.notchClip}>
              <View
                style={[
                  styles.shoulder,
                  styles.shoulderLeft,
                  { backgroundColor: colors.background },
                ]}>
                <View
                  style={[
                    styles.shoulderFill,
                    { backgroundColor: barColor, borderTopRightRadius: SHOULDER },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.shoulder,
                  styles.shoulderRight,
                  { backgroundColor: colors.background },
                ]}>
                <View
                  style={[
                    styles.shoulderFill,
                    { backgroundColor: barColor, borderTopLeftRadius: SHOULDER },
                  ]}
                />
              </View>
              <View style={[styles.notch, { backgroundColor: colors.background }]} />
            </View>

            <Animated.View style={[styles.circle, circleStyle]} testID="main-tab-active-circle">
              <Feather name={focusedTab.icon} size={22} color={palette.white} />
            </Animated.View>
            <Animated.Text
              style={[styles.label, { color: colors.text.primary }]}
              numberOfLines={1}
              testID="main-tab-active-label">
              {focusedTab.label}
            </Animated.Text>
          </Animated.View>
        ) : null}

        {tabs.map(tab => {
          const route = state.routes.find(item => item.name === tab.name)!;
          const focused = tab.name === focusedName;
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={() => press(route)}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              hitSlop={{ top: 8 }}
              style={styles.tab}
              testID={`main-tab-${tab.name}`}>
              <TabIcon icon={tab.icon} hidden={focused} color={colors.text.secondary} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// An inactive tab's icon. It fades out while its tab is active (the raised
// circle shows it instead) and back in when the tab is left.
function TabIcon({ icon, hidden, color }: { icon: FeatherName; hidden: boolean; color: string }) {
  const opacity = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    opacity.value = withTiming(hidden ? 0 : 1, { duration: hidden ? 120 : 220 });
  }, [hidden, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.inactiveIcon, style]}>
      <Feather name={icon} size={23} color={color} />
    </Animated.View>
  );
}

export default AnimatedTabBar;
