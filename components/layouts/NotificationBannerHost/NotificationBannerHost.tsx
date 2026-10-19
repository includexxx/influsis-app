import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useAuthSlice, useNotificationsLiveSlice } from '@/slices';
import { useMarkNotificationReadMutation } from '@/services/notificationsApi';
import { openNotification } from '@/lib/notifications/openNotification';
import InAppBanner from '@/components/elements/InAppBanner';

/** How long the banner stays before it hides itself. */
export const BANNER_DURATION_MS = 6_000;

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});

// Shows the high-urgency notification the realtime socket just delivered
// (slices/notificationsLive `banner`) over every screen, mounted once in
// app/_layout.tsx. The latest banner wins and restarts the timer. A tap marks
// it read (NT3, optimistic, reverted silently on failure - a 404 included)
// and opens its target through the same click flow as the feed.
export default function NotificationBannerHost() {
  const insets = useSafeAreaInsets();
  const { status } = useAuthSlice();
  const { banner, dispatch, bannerDismissed, markedReadLocally, markReadReverted } =
    useNotificationsLiveSlice();
  const [markRead] = useMarkNotificationReadMutation();

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => dispatch(bannerDismissed()), BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [banner, dispatch, bannerDismissed]);

  if (!banner || status !== 'authenticated') return null;

  const onPress = () => {
    const item = banner;
    dispatch(bannerDismissed());
    if (item.readAt === null) {
      dispatch(markedReadLocally(item.id));
      markRead({ id: item.id })
        .unwrap()
        .catch(() => dispatch(markReadReverted(item.id)));
    }
    // The read is handled above; openNotification only routes.
    openNotification(item, { status, markRead: () => {} });
  };

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <InAppBanner
        title={banner.title}
        body={banner.body}
        onPress={onPress}
        onDismiss={() => dispatch(bannerDismissed())}
      />
    </View>
  );
}
