import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { palette, radius, spacing } from '@/theme';
import Image from '../Image';

const chevronRightIcon = require('@/assets/images/withdraw/chevron-right.png');

export interface BillingRowProps {
  icon: ImageSourcePropType;
  title: string;
  description?: string;
  highlighted?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 73,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    gap: 14,
    backgroundColor: palette.gray[25],
  },
  // Figma's pressed/selected tile (node 6402:5348).
  rootHighlighted: {
    backgroundColor: palette.primary[50],
  },
  icon: {
    width: 30,
    height: 30,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: palette.gray[900],
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[300],
  },
  chevron: {
    width: 24,
    height: 24,
    transform: 'rotate(180deg)',
  },
});

// A payment-method tile on the Balance screen (Figma nodes 6402:5349,
// 5374, 5397, 5428): a 30px 3D glyph, a two-line label block and a
// trailing chevron on a flat rounded tile that turns pink when selected.
//
// Deliberately not a `SettingsRow variant="card"`: that shape is a white
// shadowed card with a 24px flat icon and a 13px description, built for
// Security Settings. This one has no shadow, a tinted fill that flips to
// pink when selected, and Figma's larger 30px/16px/14px type scale.
function BillingRow({
  icon,
  title,
  description,
  highlighted,
  onPress,
  style,
  testID,
}: BillingRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!highlighted }}
      onPress={onPress}
      style={[styles.root, highlighted && styles.rootHighlighted, style]}
      testID={testID}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Image source={chevronRightIcon} style={styles.chevron} contentFit="contain" />
    </Pressable>
  );
}

export default BillingRow;
