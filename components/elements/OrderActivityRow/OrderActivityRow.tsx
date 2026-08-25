import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface OrderActivityRowProps {
  icon: ImageSourcePropType;
  business: string;
  action: string;
  timestamp: string;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 26,
    height: 26,
  },
  textRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  businessActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  business: {
    fontSize: 14,
    lineHeight: 21,
  },
  action: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    lineHeight: 18,
  },
});

// A single row on the Order Deliver screen's "Order Activity" timeline
// (Figma node 6040:8590) - a status icon, "{business} {action}" text and a
// timestamp. `muted` reproduces Figma's own 3rd timeline item, whose action
// text is a lighter `rgba(0,0,0,0.7)` than the other two (data/orders.ts's
// `OrderActivityEvent.muted`).
function OrderActivityRow({
  icon,
  business,
  action,
  timestamp,
  muted,
  style,
  testID,
}: OrderActivityRowProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]} testID={testID}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <View style={styles.textRow}>
        <View style={styles.businessActionGroup}>
          <Text style={[styles.business, { color: palette.gray[900] }]}>{business}</Text>
          <Text
            style={[styles.action, { color: muted ? 'rgba(0, 0, 0, 0.7)' : palette.gray[900] }]}>
            {action}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: 'rgba(0, 0, 0, 0.5)' }]}>{timestamp}</Text>
      </View>
    </View>
  );
}

export default OrderActivityRow;
