import { View, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { palette, radius } from '@/theme';
import Image from '../Image';

export interface WalletAvatarProps {
  icon: ImageSourcePropType;
  /** Glyph size inside the disc. Figma uses 18 for bKash, 20 for PayPal. */
  iconSize?: number;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: palette.primary[50],
  },
});

// A provider glyph centered on a tinted disc (Figma "Group 1321314930",
// node 6212:7440 and its copies down the Transaction list). The disc is a
// flat `primary[50]` fill in Figma, so it is drawn rather than shipped as
// an image asset.
function WalletAvatar({
  icon,
  iconSize = 18,
  size = 32,
  backgroundColor,
  style,
  testID,
}: WalletAvatarProps) {
  return (
    <View
      style={[
        styles.root,
        { width: size, height: size },
        backgroundColor ? { backgroundColor } : null,
        style,
      ]}
      testID={testID}>
      <Image source={icon} style={{ width: iconSize, height: iconSize }} contentFit="contain" />
    </View>
  );
}

export default WalletAvatar;
