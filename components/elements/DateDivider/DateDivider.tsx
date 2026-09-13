import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface DateDividerProps {
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'center',
  },
});

// Centered pill date separator between groups of chat messages (Figma
// "Timeline" > "Yesterday", node 6279:8224) - generic on `label` so it can
// mark any date group a future chat screen needs ("Today", "Monday", ...).
function DateDivider({ label, style, testID }: DateDividerProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: palette.primary[50] }, style]} testID={testID}>
      <Text style={[styles.label, { color: palette.gray[300] }]}>{label}</Text>
    </View>
  );
}

export default DateDivider;
