import { Pressable, PressableProps, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';

export interface ToggleProps extends Omit<PressableProps, 'style'> {
  value: boolean;
  style?: StyleProp<ViewStyle>;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 24;
const TRACK_PADDING = 2;

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
});

// On/off switch (Figma "Toggle Only", node 6398:5373, `size="lg"` variant) -
// no toggle/switch component existed in this project before Security
// Settings. Off track color (`#E2E8F0`) is a one-off Figma token not on
// this project's own gray scale (closest, `palette.gray[50]` #E9E9EA, is
// visibly lighter) - kept literal, the same way CampaignCard's tag pill
// keeps Figma's literal `#B2FFD2` instead of forcing a palette match.
function Toggle({ value, style, ...others }: ToggleProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.track, { backgroundColor: value ? palette.primary[400] : '#E2E8F0' }, style]}
      {...others}>
      <View style={[styles.knob, getShadowStyle('sm'), value && styles.knobOn]} />
    </Pressable>
  );
}

export default Toggle;
