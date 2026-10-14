import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';

export interface ApplicationsTabItem<K extends string> {
  key: K;
  label: string;
  /** Badge next to the label, e.g. "3" or "10+"; omitted while unknown. */
  count?: string;
}

export interface ApplicationsTabsProps<K extends string> {
  tabs: ApplicationsTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
}

const PADDING = 4;
const SLIDE = { damping: 22, stiffness: 240, mass: 0.7 };

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 48,
    padding: PADDING,
    borderRadius: 16,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 12,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});

// Segmented control for the Applications screen: a recessed track with a
// raised thumb that springs to the selected segment, each segment showing
// its label and an item count.
export default function ApplicationsTabs<K extends string>({
  tabs,
  value,
  onChange,
}: ApplicationsTabsProps<K>) {
  const { colors, palette, isDark } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / tabs.length : 0;
  const index = Math.max(
    0,
    tabs.findIndex(tab => tab.key === value),
  );

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(index * segmentWidth, SLIDE);
  }, [index, segmentWidth, x]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: isDark ? palette.gray[800] : palette.gray[25] }]}>
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            getShadowStyle('sm'),
            { width: segmentWidth, backgroundColor: isDark ? palette.gray[600] : palette.white },
            thumbStyle,
          ]}
        />
      ) : null}
      {tabs.map(tab => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.count ? `${tab.label}, ${tab.count}` : tab.label}
            onPress={() => onChange(tab.key)}
            style={styles.segment}
            testID={`applications-tab-${tab.key}`}>
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.text.primary : colors.text.secondary,
                  fontWeight: selected ? '700' : '600',
                },
              ]}>
              {tab.label}
            </Text>
            {tab.count ? (
              <View
                style={[
                  styles.count,
                  {
                    backgroundColor: selected
                      ? palette.primary[isDark ? 400 : 500]
                      : isDark
                        ? palette.gray[700]
                        : palette.gray[50],
                  },
                ]}>
                <Text
                  style={[
                    styles.countText,
                    { color: selected ? palette.white : colors.text.secondary },
                  ]}>
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
