import { useCallback, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  ListRenderItem,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { spacing } from '@/theme';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ViewModeToggle, { ViewMode } from '@/components/elements/ViewModeToggle';
import { topCreatorsStyle as s, GRID_GAP } from './topCreators.style';
import { CreatorCardSkeleton, CreatorDirectoryCard, CreatorsEmptyState } from './components';
import { useCreatorsFeed } from './hooks/useCreatorsFeed';
import { CreatorDirectoryItem } from './types/creatorDirectory';

const INITIAL_SKELETONS = 6;

function openCreator(userId: string) {
  router.push(`/creator/${userId}`);
}

// The Top Creators screen (Figma "Top Creator", node 6028:7456), pushed from
// Home's "Top Rated Creators" section "See all" link
// (scenes/home/components/TopRatedCreatorsSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group), the same
// reasoning as /notifications, /live-campaign, /campaigns, /businesses and
// /top-gigs. Lists every creator in the directory (RBAC API group §E3, GET
// /creator-profiles) as a virtualized FlatList, in a Stack view (default:
// full-width cards with "Creator since" and categories) or a 2-column Grid
// view, switched from the toolbar - the same pattern as the Businesses
// screen. Loading - first page or the next one - shows skeletons shaped like
// the active view.
export default function TopCreators() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<ViewMode>('stack');
  const {
    creators,
    isInitialLoading,
    isLoadingMore,
    isInitialError,
    isLoadMoreError,
    hasMore,
    loadMore,
    retry,
  } = useCreatorsFeed();

  const isGrid = view === 'grid';
  // Two equal columns inside the 16px gutters, so a lone last tile keeps
  // its width instead of stretching across the row.
  const tileWidth = (width - spacing.lg * 2 - GRID_GAP) / 2;

  const changeView = useCallback((next: ViewMode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView(next);
  }, []);

  const renderItem: ListRenderItem<CreatorDirectoryItem> = useCallback(
    ({ item }) => (
      <CreatorDirectoryCard
        creator={item}
        variant={view}
        onPress={openCreator}
        style={view === 'grid' ? { width: tileWidth } : undefined}
      />
    ),
    [view, tileWidth],
  );

  function skeletons(count: number) {
    return (
      <View style={isGrid ? s.gridSkeletons : s.stackSkeletons}>
        {Array.from({ length: count }, (_, index) => (
          <CreatorCardSkeleton
            key={index}
            variant={view}
            style={isGrid ? { width: tileWidth } : undefined}
          />
        ))}
      </View>
    );
  }

  const toolbar = (
    <View style={s.toolbar}>
      <View style={s.toolbarText}>
        <Text style={[s.toolbarTitle, { color: colors.text.primary }]}>All creators</Text>
        <Text style={[s.toolbarSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
          Creators the community loves
        </Text>
      </View>
      <ViewModeToggle value={view} onChange={changeView} testIDPrefix="creators-view" />
    </View>
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.screen}>
        <ScreenHeader title="Top Creators" onBack={() => router.back()} style={s.headerGap} />

        {isInitialLoading ? (
          <View style={s.content} testID="creators-loading">
            {toolbar}
            {skeletons(INITIAL_SKELETONS)}
          </View>
        ) : isInitialError ? (
          <View style={s.content}>
            {toolbar}
            <CreatorsEmptyState variant="error" onRetry={retry} />
          </View>
        ) : (
          <FlatList
            // numColumns can't change on a mounted FlatList - remount per view.
            key={view}
            data={creators}
            keyExtractor={item => item.userId}
            renderItem={renderItem}
            numColumns={isGrid ? 2 : 1}
            columnWrapperStyle={isGrid ? s.columnWrapper : undefined}
            ItemSeparatorComponent={isGrid ? undefined : StackSeparator}
            ListHeaderComponent={toolbar}
            style={layoutStyle.screen}
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={hasMore ? loadMore : undefined}
            ListEmptyComponent={<CreatorsEmptyState variant="empty" />}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={s.footer} testID="creators-loading-more">
                  {skeletons(isGrid ? 2 : 1)}
                </View>
              ) : isLoadMoreError ? (
                <CreatorsEmptyState variant="error" onRetry={retry} />
              ) : null
            }
            testID={`creators-list-${view}`}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StackSeparator() {
  return <View style={s.stackSeparator} />;
}
