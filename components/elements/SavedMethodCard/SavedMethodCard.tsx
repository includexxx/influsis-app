import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { palette, radius } from '@/theme';
import Image from '../Image';
import WalletAvatar from '../WalletAvatar';

const radioSelectedIcon = require('@/assets/images/withdraw/radio-selected.png');

export interface SavedMethodCardProps {
  icon: ImageSourcePropType;
  iconSize?: number;
  account: string;
  description: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 65,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  account: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: '#313131',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.gray[300],
  },
  radio: {
    width: 20,
    height: 20,
  },
  // Figma only draws the checked state; the unchecked one keeps the same
  // 20px footprint so the row doesn't reflow on selection.
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.gray[200],
  },
});

// The already-saved wallet on the Payment review screen (Figma node
// 6212:7971): a provider glyph on a tinted disc, the masked account number
// and its "Save by ..." line, and a pink filled check when selected.
function SavedMethodCard({
  icon,
  iconSize,
  account,
  description,
  selected,
  onPress,
  style,
  testID,
}: SavedMethodCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'radio' : undefined}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.root, style]}
      testID={testID}>
      <View style={styles.leading}>
        <WalletAvatar icon={icon} iconSize={iconSize} />
        <View>
          <Text style={styles.account}>{account}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {selected ? (
        <Image source={radioSelectedIcon} style={styles.radio} contentFit="contain" />
      ) : (
        <View style={styles.radioEmpty} />
      )}
    </Pressable>
  );
}

export default SavedMethodCard;
