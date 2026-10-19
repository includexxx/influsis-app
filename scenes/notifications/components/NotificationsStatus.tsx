import { Animated, View } from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import EmptyState from '@/components/elements/EmptyState';
import SearchIllustration from '@/components/elements/SearchIllustration';
import Button from '@/components/elements/Button';
import { useSkeletonPulse } from '@/scenes/campaigns/hooks/useSkeletonPulse';
import { NotificationsFilter } from '../hooks/useNotificationsFeed';
import { notificationsStyle as s } from '../notifications.style';

const SKELETON_COUNT = 3;

// Three NotificationCard-shaped placeholders while page 1 loads.
export function NotificationsSkeleton() {
  const { colors, palette } = useTheme();
  const opacity = useSkeletonPulse();
  const block = { backgroundColor: palette.gray[50], opacity };

  return (
    <View style={[s.status, s.skeletonList]} testID="notifications-loading">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <View
          key={i}
          style={[s.skeletonCard, getShadowStyle('sm'), { backgroundColor: colors.card }]}>
          <Animated.View style={[s.skeletonIcon, block]} />
          <View style={s.skeletonText}>
            <Animated.View style={[s.skeletonTitle, block]} />
            <Animated.View style={[s.skeletonBody, block]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const EMPTY_COPY: Record<NotificationsFilter, { title: string; description: string }> = {
  all: {
    title: 'No notifications yet',
    description: 'Updates about your campaigns, offers and deliveries show up here.',
  },
  unread: {
    title: "You're all caught up",
    description: 'You have no unread notifications.',
  },
};

export function NotificationsEmpty({ filter }: { filter: NotificationsFilter }) {
  const copy = EMPTY_COPY[filter];
  return (
    <View style={[s.status, s.statusBlock]} testID="notifications-empty">
      <EmptyState
        illustration={<SearchIllustration />}
        title={copy.title}
        description={copy.description}
      />
    </View>
  );
}

// First page failed (offline included): the same EmptyState shape with a retry.
export function NotificationsError({ onRetry }: { onRetry: () => void }) {
  const { palette } = useTheme();
  return (
    <View style={[s.status, s.statusBlock]} testID="notifications-error">
      <EmptyState
        illustration={<SearchIllustration />}
        title="Couldn't load notifications"
        description="Check your connection and try again."
      />
      <Button
        title="Try again"
        accessibilityRole="button"
        onPress={onRetry}
        style={[s.retryButton, { backgroundColor: palette.primary[400] }]}
        titleStyle={[s.retryTitle, { color: palette.white }]}
      />
    </View>
  );
}
