import { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle, radius, spacing } from '@/theme';
import Image from '../Image';

const chevronRightIcon = require('@/assets/images/icons/arrow-right.png');

export type SettingsRowVariant = 'flat' | 'card';

export interface SettingsRowProps {
  icon: ImageSourcePropType;
  iconTint?: string;
  iconBackground?: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
  variant?: SettingsRowVariant;
  showChevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  flat: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 29,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: 20,
    gap: 4,
  },
  chipTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 4,
  },
  cardTextBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    width: 24,
    height: 24,
  },
});

// Icon + title(+description) + trailing-slot row, in two shapes taken from
// the Account screen (Figma "Elements=Settings", node 6027:8180 and
// siblings - `variant="flat"`, a chevron-terminated menu row with no card
// background) and Security Settings (Figma "Settings Complex", node
// 6398:5366 and siblings - `variant="card"`, a white rounded-shadow card
// with a description line and a `Toggle` trailing slot instead of a
// chevron). `trailing` is a generic slot (defaults to the chevron icon on
// `flat`, since every Account row uses it) rather than a fixed prop, so
// this same row shape can carry either affordance. `iconBackground` is an
// opt-in tinted chip behind the glyph (used by the Account screen's grouped
// setting cards); leaving it unset keeps the bare-glyph rendering.
function SettingsRow({
  icon,
  iconTint,
  iconBackground,
  title,
  description,
  trailing,
  variant = 'flat',
  showChevron = true,
  destructive,
  onPress,
  style,
  testID,
}: SettingsRowProps) {
  const { colors, palette } = useTheme();
  const isCard = variant === 'card';

  const titleColor = destructive ? colors.error : colors.text.primary;

  const iconImage = (
    <Image
      source={icon}
      style={[styles.icon, iconTint ? { tintColor: iconTint } : null]}
      contentFit="contain"
    />
  );

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[
        isCard ? styles.card : styles.flat,
        isCard && getShadowStyle('sm'),
        isCard && { backgroundColor: colors.card },
        style,
      ]}>
      {iconBackground ? (
        <View style={[styles.iconChip, { backgroundColor: iconBackground }]}>{iconImage}</View>
      ) : (
        iconImage
      )}
      <View
        style={
          isCard ? styles.cardTextBlock : iconBackground ? styles.chipTextBlock : styles.textBlock
        }>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: palette.gray[300] }]}>{description}</Text>
        ) : null}
      </View>
      {trailing ??
        (!isCard && showChevron && (
          <Image source={chevronRightIcon} style={styles.chevron} contentFit="contain" />
        ))}
    </Pressable>
  );
}

export default SettingsRow;
