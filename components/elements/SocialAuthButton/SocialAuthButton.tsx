import {
  Pressable,
  PressableProps,
  Text,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const arrowRightIcon = require('@/assets/images/icons/arrow-right.png');

export interface SocialAuthButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  icon: ImageSourcePropType;
  iconStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  arrow: {
    width: 24,
    height: 24,
  },
});

function SocialAuthButton({
  label,
  icon,
  iconStyle,
  style,
  disabled,
  ...others
}: SocialAuthButtonProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.root,
        {
          borderColor: palette.gray[100],
          backgroundColor: colors.card,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...others}>
      <Image source={icon} style={[styles.icon, iconStyle]} contentFit="contain" />
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      <Image source={arrowRightIcon} style={styles.arrow} contentFit="contain" />
    </Pressable>
  );
}

export default SocialAuthButton;
