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
import Image from '../Image';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

export interface ChatHeaderProps {
  avatar: ImageSourcePropType;
  name: string;
  online?: boolean;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

const AVATAR_SIZE = 46;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  statusDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  textBlock: {
    gap: 2,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    lineHeight: 25,
  },
});

// The chat detail screen's header (Figma "Header" > "Frame 162419", node
// 6279:8215) - back chevron, avatar with an online-status dot, and a
// name + status column. Distinct from ScreenHeader (which centers a plain
// title) - this one left-aligns an avatar/name block next to the back
// button, so it isn't built on top of it.
function ChatHeader({ avatar, name, online, onBack, style }: ChatHeaderProps) {
  const { colors, palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backButton}
          onPress={onBack}>
          <Image source={backChevronIcon} style={styles.backButton} contentFit="contain" />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <View style={styles.avatarWrap}>
        <Image source={avatar} style={styles.avatar} contentFit="cover" />
        {online && (
          <View
            style={[
              styles.statusDot,
              { backgroundColor: palette.secondary[400], borderColor: colors.card },
            ]}
          />
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.status, { color: palette.gray[300] }]}>
          {online ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );
}

export default ChatHeader;
