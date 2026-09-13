import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '@/hooks';
import CircleAvatar from '../CircleAvatar';

export interface ConversationCardProps {
  avatar: ImageSourcePropType;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 66,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  preview: {
    fontSize: 12,
    lineHeight: 18,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 7,
  },
  time: {
    fontSize: 12,
    lineHeight: 14,
  },
  badge: {
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLabel: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
  },
});

// A single conversation row on the Messages tab's list (Figma "Frame
// 1707480323" and 7 siblings, node 6280:8308 etc.) - a 50px circular
// avatar, name + last-message preview, and a trailing time + unread-count
// badge stack. Reused as-is for every thread in data/messages.ts.
//
// Figma's `#AAAAAA` preview/time gray is normalized to the closest palette
// token (`gray[200]`, `#A5A5AB`), the same normalization NotificationCard
// applies to its own near-identical per-instance grays.
function ConversationCard({
  avatar,
  name,
  lastMessage,
  time,
  unreadCount,
  onPress,
  style,
  testID,
}: ConversationCardProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, style]}>
      <CircleAvatar source={avatar} size={50} />
      <View style={styles.textBlock}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.preview, { color: palette.gray[200] }]} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.time, { color: palette.gray[200] }]}>{time}</Text>
        {!!unreadCount && (
          <View style={[styles.badge, { backgroundColor: palette.primary[400] }]}>
            <Text style={[styles.badgeLabel, { color: palette.white }]}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default ConversationCard;
