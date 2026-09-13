import { Pressable, PressableProps, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const checkedIcon = require('@/assets/images/create-gig/checkbox-checked.png');

export interface CheckboxProps extends Omit<PressableProps, 'style'> {
  checked?: boolean;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    width: 20,
    height: 20,
  },
  unchecked: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
});

// Small toggle box (Figma "What's Included" feature rows, node 6301:8078
// unchecked / 6525:6310 checked) - unchecked is a plain bordered square,
// checked swaps in the exported pink checkmark-square-2 asset wholesale
// (it already draws its own square background, so no border is applied to
// it). Generic enough for any future include/exclude toggle list.
function Checkbox({ checked, style, ...others }: CheckboxProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      hitSlop={8}
      style={[styles.root, style]}
      {...others}>
      {checked ? (
        <Image source={checkedIcon} style={styles.root} contentFit="contain" />
      ) : (
        <View style={[styles.unchecked, { borderColor: palette.gray[100] }]} />
      )}
    </Pressable>
  );
}

export default Checkbox;
