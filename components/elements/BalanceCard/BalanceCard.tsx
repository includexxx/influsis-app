import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '@/theme';
import Image from '../Image';

const arrowUpIcon = require('@/assets/images/withdraw/arrow-up.png');
const arrowRightIcon = require('@/assets/images/withdraw/arrow-right-circle.png');
const chartImage = require('@/assets/images/withdraw/balance-chart.png');

export interface BalanceCardProps {
  label?: string;
  total: string;
  change: string;
  changeDirection?: 'up' | 'down';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    height: 191,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: palette.primary[500],
  },
  // The sparkline is bottom-anchored artwork behind the figures, inset the
  // same 16px as the card's own content (Figma node 6402:5339).
  chart: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    height: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    lineHeight: 30,
    color: palette.gray[25],
  },
  total: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    marginTop: 10,
    color: palette.white,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
  },
  pillIcon: {
    width: 14,
    height: 14,
  },
  // Figma's "down" state isn't drawn - the same arrow glyph is flipped
  // rather than shipping a second asset for it.
  pillIconDown: {
    transform: [{ rotate: '180deg' }],
  },
  pillLabel: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.28,
    color: palette.gray[400],
  },
  arrow: {
    width: 24,
    height: 24,
  },
});

// The pink "Total Balance" hero card on the Balance screen (Figma nodes
// 6402:5327 + 5328 + 5339): the balance and its period-over-period delta
// pill sit on top of a bottom-anchored sparkline.
//
// Figma's only affordance on the card is the 24px trailing arrow; the whole
// card is the tap target so it stays reachable, with the arrow still
// reading as the affordance.
function BalanceCard({
  label = 'Total Balance',
  total,
  change,
  changeDirection = 'up',
  onPress,
  style,
  testID,
}: BalanceCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.root, style]}
      testID={testID}>
      <Image source={chartImage} style={styles.chart} contentFit="fill" />
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.total}>{total}</Text>
        </View>
        <View style={styles.trailing}>
          <View style={styles.pill}>
            <Image
              source={arrowUpIcon}
              style={[styles.pillIcon, changeDirection === 'down' && styles.pillIconDown]}
              contentFit="contain"
            />
            <Text style={styles.pillLabel}>{change}</Text>
          </View>
          <Image source={arrowRightIcon} style={styles.arrow} contentFit="contain" />
        </View>
      </View>
    </Pressable>
  );
}

export default BalanceCard;
