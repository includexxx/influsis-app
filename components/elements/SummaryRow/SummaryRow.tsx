import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette, radius } from '@/theme';

export type SummaryRowVariant = 'plain' | 'filled';

export interface SummaryRowProps {
  label: string;
  value: string;
  variant?: SummaryRowVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  plain: {
    alignItems: 'flex-start',
  },
  plainLabel: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.28,
    color: palette.gray[300],
  },
  plainValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.28,
    textAlign: 'right',
    color: palette.gray[900],
  },
  filled: {
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 24,
    paddingVertical: 19,
    borderRadius: radius.md,
    // Figma's literal `#EFEFEF` review-card fill - one step lighter than
    // `palette.gray[50]` (#E9E9EA) and not a token, so it is used verbatim.
    backgroundColor: '#EFEFEF',
  },
  filledLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: palette.gray[900],
  },
  filledValue: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.black,
  },
});

// A label-left / value-right line, in the two shapes the withdraw flow
// uses: `plain` is the success screen's borderless "Transaction ID" and
// "Date & Time" lines (Figma node 6407:5825); `filled` is the Payment
// review screen's gray "Withdraw amount / $750" card (node 6212:7979).
function SummaryRow({ label, value, variant = 'plain', style, testID }: SummaryRowProps) {
  const isFilled = variant === 'filled';

  return (
    <View style={[styles.root, isFilled ? styles.filled : styles.plain, style]} testID={testID}>
      <Text style={isFilled ? styles.filledLabel : styles.plainLabel}>{label}</Text>
      <Text style={isFilled ? styles.filledValue : styles.plainValue}>{value}</Text>
    </View>
  );
}

export default SummaryRow;
