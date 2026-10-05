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
import { businessesStyle as s, GRID_GAP } from './businesses.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ViewModeToggle from '@/components/elements/ViewModeToggle';
import { BusinessCard, BusinessCardSkeleton, BusinessesEmptyState } from './components';
import { BusinessCardVariant } from './components/BusinessCard';
import { useBusinessesFeed } from './hooks/useBusinessesFeed';
import { BusinessDirectoryItem } from './types/businessDirectory';

const INITIAL_SKELETONS = 6;

function openBusiness(userId: string) {
  router.push(`/business/${userId}`);
}

// The Businesses screen (Figma "All Businesses", node 6010:16780), pushed
// from Home's "Businesses" section "See all" link
// (scenes/home/components/BusinessLogosSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group) since Figma
// shows no tab bar on this screen, the same reasoning as /notifications,
// /live-campaign and /campaigns. Lists every business in the directory
// (RBAC API group §E1, GET /business-profiles) as a virtualized FlatList,
// in a Stack view (default: full-width cards with description and
// categories) or a 2-column Grid view, switched from the toolbar. Loading -
// first page or the next one - shows skeletons shaped like the active view.
export default function Businesses() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<BusinessCardVariant>('stack');
  const {
    businesses,
    isInitialLoading,
    isLoadingMore,
    isInitialError,
    isLoadMoreError,
    hasMore,
    loadMore,
    retry,
  } = useBusinessesFeed();

  const isGrid = view === 'grid';
  // Two equal columns inside the 16px gutters, so a lone last tile keeps
  // its width instead of stretching across the row.
  const tileWidth = (width - spacing.lg * 2 - GRID_GAP) / 2;
  const gridItem = { width: tileWidth };

  const changeView = useCallback((next: BusinessCardVariant) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView(next);
  }, []);

  const renderItem: ListRenderItem<BusinessDirectoryItem> = useCallback(
    ({ item }) => (
      <BusinessCard
        business={item}
        variant={view}
        onPress={openBusiness}
        style={view === 'grid' ? { width: tileWidth } : undefined}
      />
    ),
    [view, tileWidth],
  );

  function skeletons(count: number) {
    return (
      <View style={isGrid ? s.gridSkeletons : s.stackSkeletons}>
        {Array.from({ length: count }, (_, index) => (
          <BusinessCardSkeleton key={index} variant={view} style={isGrid ? gridItem : undefined} />
        ))}
      </View>
    );
  }

  const toolbar = (
    <View style={s.toolbar}>
      <View style={s.toolbarText}>
        <Text style={[s.toolbarTitle, { color: colors.text.primary }]}>All businesses</Text>
        <Text style={[s.toolbarSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
          Brands hiring creators on Influsis
        </Text>
      </View>
      <ViewModeToggle value={view} onChange={changeView} testIDPrefix="businesses-view" />
    </View>
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.screen}>
        <ScreenHeader title="Businesses" onBack={() => router.back()} style={s.headerGap} />

        {isInitialLoading ? (
          <View style={s.content} testID="businesses-loading">
            {toolbar}
            {skeletons(INITIAL_SKELETONS)}
          </View>
        ) : isInitialError ? (
          <View style={s.content}>
            {toolbar}
            <BusinessesEmptyState variant="error" onRetry={retry} />
          </View>
        ) : (
          <FlatList
            // numColumns can't change on a mounted FlatList - remount per view.
            key={view}
            data={businesses}
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
            ListEmptyComponent={<BusinessesEmptyState variant="empty" />}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={s.footer} testID="businesses-loading-more">
                  {skeletons(isGrid ? 2 : 1)}
                </View>
              ) : isLoadMoreError ? (
                <BusinessesEmptyState variant="error" onRetry={retry} />
              ) : null
            }
            testID={`businesses-list-${view}`}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StackSeparator() {
  return <View style={s.stackSeparator} />;
}
