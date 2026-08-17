import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@/theme';

export interface EarningTileProps {
  value: string;
  label: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: 86,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    backgroundColor: palette.gray[25],
  },
  value: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: palette.gray[900],
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6,
    color: palette.gray[300],
  },
});

// Value-over-label money tile - the "$150.00 / Monthly earning" and
// "$1550.00 / Total earning" pair under the Balance screen's hero card
// (Figma nodes 6402:5299/5300 + 5337/5338/5342/5343). Distinct from
// `StatTile`, which is an icon-led tile with the value *below* a smaller
// label and no fixed height; this one is text-only and figure-first.
function EarningTile({ value, label, backgroundColor, style, testID }: EarningTileProps) {
  return (
    <View
      style={[styles.root, backgroundColor ? { backgroundColor } : null, style]}
      testID={testID}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default EarningTile;
