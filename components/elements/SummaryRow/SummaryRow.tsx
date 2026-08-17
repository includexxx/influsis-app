import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette } from '@/theme';

export interface SummaryRowProps {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.28,
    color: palette.gray[300],
  },
  value: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.28,
    textAlign: 'right',
    color: palette.gray[900],
  },
});

// A borderless label-left / value-right line - the "Transaction ID" and
// "Date & Time" pair at the bottom of the withdraw confirmation screen
// (Figma node 6407:5825).
function SummaryRow({ label, value, style, testID }: SummaryRowProps) {
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default SummaryRow;
