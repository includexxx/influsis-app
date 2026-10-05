import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { fonts, radius } from '@/theme';

export interface AppHeaderProps {
  onNotificationPress?: () => void;
  /** Shows a small dot on the bell when there is something unread. */
  hasUnread?: boolean;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 28,
  },
  // 44pt touch target (Apple HIG / Material minimum).
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellPressed: { opacity: 0.7 },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
});

// Wordmark + notification bell row shown at the top of every main app tab
// screen (Figma "Home", node 6121:6522) - reused wherever this shape repeats.
function AppHeader({ onNotificationPress, hasUnread, style }: AppHeaderProps) {
  const { colors, palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Influsis home"
        onPress={() => router.push('/home')}>
        <Text style={[styles.wordmark, { color: palette.primary[400] }]}>Influsis.</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        accessibilityHint={hasUnread ? 'You have unread notifications' : undefined}
        onPress={onNotificationPress}
        hitSlop={4}
        style={({ pressed }) => [
          styles.bellButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.bellPressed,
        ]}>
        <Feather name="bell" size={20} color={colors.text.primary} />
        {hasUnread ? (
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: palette.primary[500], borderColor: colors.card },
            ]}
            testID="app-header-unread"
          />
        ) : null}
      </Pressable>
    </View>
  );
}

export default AppHeader;
