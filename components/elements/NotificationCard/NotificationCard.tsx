import {
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '@/hooks';
import { NotificationIconName } from '@/types';
import Image from '../Image';

const moneyTickIcon = require('@/assets/images/notifications/money-tick.png');
const walletIcon = require('@/assets/images/notifications/wallet.png');

export interface NotificationCardProps {
  icon: NotificationIconName;
  title: string;
  description: string;
  time: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Figma's `0px 6px 25px rgba(8,9,11,0.1)` card shadow, platform-branched the
// same way CampaignCard's `listShadow` is - raw `shadow*` style props are
// deprecated on React Native Web in favor of `boxShadow`.
const cardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 6px 25px rgba(8, 9, 11, 0.1)' }
    : {
        shadowColor: '#08090B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 6,
      };

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 16,
  },
  main: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  textBlock: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: -0.24,
  },
  time: {
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: -0.24,
  },
});

const icons: Record<NotificationIconName, ImageSourcePropType> = {
  'money-tick': moneyTickIcon,
  wallet: walletIcon,
};

// Notification list item (Figma "Card"/"Card 01"-"Card 5", node 6346:5583
// and siblings) - a colored icon circle, title + description, and a
// trailing timestamp. Title/description/time colors are normalized to the
// theme's semantic text tokens rather than the handful of near-identical
// grays Figma uses per-instance (#030304 vs #1A1C1E for titles, #777980 vs
// #6C7278/#ACB5BB for description/time) - see docs/screen/notifications.
function NotificationCard({
  icon,
  title,
  description,
  time,
  onPress,
  style,
  testID,
}: NotificationCardProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, cardShadow, { backgroundColor: colors.card }, style]}>
      <View style={styles.main}>
        <View style={[styles.iconCircle, { backgroundColor: palette.primary[400] }]}>
          <Image source={icons[icon]} style={styles.icon} contentFit="contain" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.description, { color: palette.gray[300] }]}>{description}</Text>
        </View>
      </View>
      <Text style={[styles.time, { color: palette.gray[300] }]}>{time}</Text>
    </Pressable>
  );
}

export default NotificationCard;
