import { Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    height: 33,
    borderRadius: 53,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
  },
});

// Filter pill (Figma node 6138:5505's "Food"/"Sports"/"Beauty"/
// "Entertainment"/"Education" row on the Search screen) - selected state
// (solid brand-pink fill, white label) confirmed via the Figma screenshot's
// "Food" chip; unselected is a plain outlined pill. Generic `label`/
// `selected`/`onPress` so any future filter row (Order, Message, ...) can
// reuse it.
function CategoryChip({ label, selected, onPress, style, testID }: CategoryChipProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.root,
        {
          backgroundColor: selected ? palette.primary[400] : palette.white,
          borderColor: selected ? palette.primary[400] : palette.gray[100],
        },
        style,
      ]}>
      <Text style={[styles.label, { color: selected ? palette.white : palette.gray[900] }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default CategoryChip;
