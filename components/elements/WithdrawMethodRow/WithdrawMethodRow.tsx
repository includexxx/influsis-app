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

const chevronActiveIcon = require('@/assets/images/withdraw/chevron-right-active.png');
const chevronMutedIcon = require('@/assets/images/withdraw/chevron-right-muted.png');

export interface WithdrawMethodRowProps {
  // Logo-only shape: a full provider wordmark, no text (bKash/Nagad/Rocket).
  logo?: ImageSourcePropType;
  logoWidth?: number;
  logoHeight?: number;
  // Icon + label shape: a 3D glyph beside a label (Bank Account, Visa Debit
  // Card). Figma uses both shapes in the same list.
  icon?: ImageSourcePropType;
  iconSize?: number;
  label?: string;
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
    minHeight: 56,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.gray[50],
    backgroundColor: palette.white,
  },
  rootSelected: {
    borderColor: palette.primary[400],
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  chevron: {
    width: 24,
    height: 24,
  },
});

// One row of the Withdraw Method picker (Figma node 6212:7700). Figma mixes
// two shapes in the same list - the three mobile wallets are a bare
// provider logo with no text, while "Bank Account" and "Visa Debit Card"
// pair a 3D glyph with a label - so this row carries both.
//
// The selected row gets a pink border and a pink chevron; every other row
// is a hairline gray card with a gray chevron. Those are two separate
// exports in Figma rather than one tinted glyph.
function WithdrawMethodRow({
  logo,
  logoWidth,
  logoHeight,
  icon,
  iconSize = 30,
  label,
  selected,
  onPress,
  style,
  testID,
}: WithdrawMethodRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.root, selected && styles.rootSelected, style]}
      testID={testID}>
      <View style={styles.leading}>
        {logo ? (
          <Image
            source={logo}
            style={{ width: logoWidth, height: logoHeight }}
            contentFit="contain"
          />
        ) : null}
        {icon ? (
          <Image source={icon} style={{ width: iconSize, height: iconSize }} contentFit="contain" />
        ) : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
      <Image
        source={selected ? chevronActiveIcon : chevronMutedIcon}
        style={styles.chevron}
        contentFit="contain"
      />
    </Pressable>
  );
}

export default WithdrawMethodRow;
