import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { palette } from '@/theme';
import WalletAvatar from '../WalletAvatar';

export interface TransactionRowProps {
  icon: ImageSourcePropType;
  iconSize?: number;
  title: string;
  date: string;
  amount: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  // Figma's literal `#313131` for the transfer title - the same near-gray
  // this project already uses verbatim on Order Details rather than
  // snapping it to a slightly-off `palette.gray` step.
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#313131',
  },
  date: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  amount: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.black,
  },
});

// One row of the Transaction history (Figma node 6212:7438 and its
// siblings): a provider glyph on a tinted disc, the transfer's title and
// relative date, and the signed amount hard right.
function TransactionRow({
  icon,
  iconSize,
  title,
  date,
  amount,
  onPress,
  style,
  testID,
}: TransactionRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.root, style]}
      testID={testID}>
      <View style={styles.leading}>
        <WalletAvatar icon={icon} iconSize={iconSize} />
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
}

export default TransactionRow;
