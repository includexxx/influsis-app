import {
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { palette, spacing } from '@/theme';
import Image from '../Image';

export interface BankRowProps {
  logo: ImageSourcePropType;
  name: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  // Every logo is boxed at 30x30 and contained rather than sized per-bank:
  // the raw Figma exports had their whitespace margins trimmed
  // (scripts/rasterize-withdraw-bank-assets.py), so each mark fills its own
  // box the way Figma's cropped fills do.
  logo: {
    width: 30,
    height: 30,
  },
  name: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[900],
  },
});

// One entry in the "All Banks" directory on the Withdraw to Bank screen
// (Figma node 6212:7658 and its siblings), and the same shape reused as the
// selected-bank chip on the account-number screen (node 6245:5635).
function BankRow({ logo, name, onPress, style, testID }: BankRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.root, style]}
      testID={testID}>
      <Image source={logo} style={styles.logo} contentFit="contain" />
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

export default BankRow;
