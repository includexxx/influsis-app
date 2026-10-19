import { useEffect } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle, radius, spacing } from '@/theme';

export interface InAppBannerProps {
  title: string;
  body: string;
  onPress: () => void;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  // The tappable part: everything but the close button.
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  // 44pt touch target (Apple HIG / Material minimum).
  dismiss: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// The in-app banner for a high-urgency notification that arrives while the
// app is open (build-plan 38b; backend CLIENT_INTEGRATION §6). Presentational
// only - components/layouts/NotificationBannerHost owns when it shows and what
// a tap does. Server text is plain: rendered with <Text>.
function InAppBanner({ title, body, onPress, onDismiss, style }: InAppBannerProps) {
  const { colors, palette } = useTheme();

  // Android reads the live region; iOS needs an explicit announcement.
  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(title);
  }, [title]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        getShadowStyle('lg'),
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      testID="in-app-banner">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={body ? `${title}. ${body}` : title}
        accessibilityHint="Opens the notification"
        onPress={onPress}
        style={styles.main}>
        <View style={[styles.iconCircle, { backgroundColor: palette.primary[400] }]}>
          <Feather name="bell" size={18} color={palette.white} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {body ? (
            <Text style={[styles.body, { color: palette.gray[300] }]} numberOfLines={1}>
              {body}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={4}
        onPress={onDismiss}
        style={styles.dismiss}>
        <Feather name="x" size={18} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

export default InAppBanner;
