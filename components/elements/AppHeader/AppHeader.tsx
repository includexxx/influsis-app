import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { fonts, radius } from '@/theme';
import { formatBadgeCount } from '@/lib/notifications/badge';

export interface AppHeaderProps {
  onNotificationPress?: () => void;
  /** Unread notifications (backend NT2); above 0 shows a count on the bell. */
  unreadCount?: number;
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
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});

// Wordmark + notification bell row shown at the top of every main app tab
// screen (Figma "Home", node 6121:6522) - reused wherever this shape repeats.
function AppHeader({ onNotificationPress, unreadCount = 0, style }: AppHeaderProps) {
  const { colors, palette } = useTheme();
  const badge = unreadCount > 0 ? formatBadgeCount(unreadCount) : null;

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
        accessibilityLabel={badge ? `Notifications, ${badge} unread` : 'Notifications'}
        onPress={onNotificationPress}
        hitSlop={4}
        style={({ pressed }) => [
          styles.bellButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.bellPressed,
        ]}>
        <Feather name="bell" size={20} color={colors.text.primary} />
        {badge ? (
          <View
            style={[
              styles.unreadBadge,
              { backgroundColor: palette.primary[500], borderColor: colors.card },
            ]}
            testID="app-header-unread">
            <Text style={[styles.unreadText, { color: palette.white }]}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export default AppHeader;
