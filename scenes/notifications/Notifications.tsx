import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { useAuthSlice, useNotificationsLiveSlice } from '@/slices';
import { NotificationIconName, NotificationItem } from '@/types';
import ScreenHeader from '@/components/elements/ScreenHeader';
import NotificationCard from '@/components/elements/NotificationCard';
import ApplicationsTabs from '@/scenes/campaigns/components/applications/ApplicationsTabs';
import { formatRelativeTime } from '@/scenes/campaigns/utils/mapApplication';
import { openNotification } from '@/lib/notifications/openNotification';
import { NOTIFICATIONS_PATH } from '@/lib/notifications/route-map';
import { notificationsStyle as s } from './notifications.style';
import { NotificationsFilter, useNotificationsFeed } from './hooks/useNotificationsFeed';
import { useNotificationReadState } from './hooks/useNotificationReadState';
import { applyReadState, mergeIncoming, newestCreatedAt } from './utils/readState';
import {
  NotificationsEmpty,
  NotificationsError,
  NotificationsSkeleton,
} from './components/NotificationsStatus';

const TABS: { key: NotificationsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

// The existing card icons, by category; anything else gets the generic bell.
function iconFor(category: string): NotificationIconName {
  if (category === 'offer') return 'money-tick';
  if (category === 'engagement') return 'wallet';
  return 'generic';
}

// The Notifications screen (Figma "Notification", node 6346:5575), pushed
// from the AppHeader bell. The creator's real feed (backend NT1), newest
// first, with All / Unread, pull-to-refresh and infinite scroll. A tap marks
// the item read (NT3, optimistic) and opens its target through
// lib/notifications/route-map.ts; "Mark all as read" sends NT4 with the
// newest createdAt on screen. Server text is plain - rendered with <Text>.
export default function Notifications() {
  const { colors, palette } = useTheme();
  const { status } = useAuthSlice();
  const [filter, setFilter] = useState<NotificationsFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const feed = useNotificationsFeed(filter);
  const { readState, markRead, markAllRead, isMarkingAll, markAllError } =
    useNotificationReadState();

  const live = useNotificationsLiveSlice();

  // NT1 pages + what the socket delivered since (38b), then read state from
  // other devices, then this screen's own optimistic marks on top.
  const items = useMemo(
    () =>
      applyReadState(
        applyReadState(mergeIncoming(feed.items, live.incoming, filter === 'unread'), live.read),
        readState,
      ),
    [feed.items, live.incoming, live.read, readState, filter],
  );

  // A reconnect or `realtime:resync` while the screen is open: events are not
  // replayed, so reload page 1 (the value at mount is not a resync).
  const { refresh } = feed;
  const seenResync = useRef(live.resyncCount);
  useEffect(() => {
    if (live.resyncCount === seenResync.current) return;
    seenResync.current = live.resyncCount;
    void refresh();
  }, [live.resyncCount, refresh]);
  const hasUnread = items.some(item => item.readAt === null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await feed.refresh();
    setRefreshing(false);
  }, [feed]);

  const onMarkAll = () => {
    const before = newestCreatedAt(items);
    if (before) void markAllRead(before);
  };

  const onOpen = (item: NotificationItem) =>
    openNotification(item, { status, markRead, currentPath: NOTIFICATIONS_PATH });

  const header = (
    <View>
      <ScreenHeader title="Notification" onBack={() => router.back()} style={s.headerGap} />
      <ApplicationsTabs tabs={TABS} value={filter} onChange={setFilter} />
      <View style={s.toolbar}>
        {hasUnread ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isMarkingAll }}
            disabled={isMarkingAll}
            hitSlop={8}
            onPress={onMarkAll}
            testID="notifications-mark-all">
            <Text
              style={[
                s.toolbarAction,
                { color: isMarkingAll ? palette.gray[300] : palette.primary[500] },
              ]}>
              Mark all as read
            </Text>
          </Pressable>
        ) : null}
      </View>
      {markAllError ? (
        <Text accessibilityRole="alert" style={[s.inlineMessage, { color: palette.error[700] }]}>
          {markAllError}
        </Text>
      ) : null}
      {feed.isRefreshError ? (
        <Text accessibilityRole="alert" style={[s.inlineMessage, { color: palette.error[700] }]}>
          Couldn&apos;t refresh. Pull down to try again.
        </Text>
      ) : null}
      <View style={s.listTop} />
    </View>
  );

  const empty = feed.isInitialLoading ? (
    <NotificationsSkeleton />
  ) : feed.isInitialError ? (
    <NotificationsError onRetry={feed.retry} />
  ) : (
    <NotificationsEmpty filter={filter} />
  );

  const footer = feed.isLoadingMore ? (
    <View style={s.footer} testID="notifications-loading-more">
      <ActivityIndicator color={palette.primary[500]} />
    </View>
  ) : feed.isLoadMoreError ? (
    <View style={s.footer}>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={feed.retry}>
        <Text style={[s.footerRetry, { color: palette.primary[500] }]}>
          Couldn&apos;t load more. Retry
        </Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <FlatList
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            icon={iconFor(item.category)}
            title={item.title}
            description={item.body}
            time={formatRelativeTime(item.createdAt)}
            unread={item.readAt === null}
            onPress={() => onOpen(item)}
            testID={`notification-${item.id}`}
          />
        )}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary[500]}
            colors={[palette.primary[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
