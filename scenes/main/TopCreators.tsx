import { useCallback } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, topCreatorsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CreatorCard from '@/components/elements/CreatorCard';
import { CreatorCardSkeleton, CreatorsEmptyState } from '@/scenes/creator/components';
import { useCreatorsFeed } from '@/scenes/creator/hooks/useCreatorsFeed';
import { formatCreatorLocation } from '@/scenes/creator/utils/creatorLocation';
import { CreatorDirectoryItem } from '@/scenes/creator/types/creatorDirectory';

const INITIAL_SKELETON_COUNT = 4;

// The Top Creators screen (Figma "Top Creator", node 6028:7456), pushed from
// the Home tab's "Top Rated Creator" section "See all" link
// (scenes/home/components/TopRatedCreatorsSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group), the same
// reasoning as /notifications, /live-campaign, /campaigns, /businesses and
// /top-gigs. Shows every creator in the directory (RBAC API group §E3, GET
// /creator-profiles) via a virtualized FlatList, rather than the mock
// data/topCreators.ts fixture this screen used before real backend wiring
// started.
export default function TopCreators() {
  const { colors } = useTheme();
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

  const renderItem: ListRenderItem<CreatorDirectoryItem> = useCallback(
    ({ item }) => (
      <CreatorCard
        image={item.avatarUrl ? { uri: item.avatarUrl } : null}
        name={item.displayName}
        verified={item.verificationStatus === 'verified'}
        location={formatCreatorLocation(item.city, item.state, item.country)}
        tags={item.categories}
        onPress={() => router.push(`/creator/${item.userId}`)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.screen}>
        <ScreenHeader
          title="Top Creators"
          onBack={() => router.back()}
          style={topCreatorsStyle.headerGap}
        />

        {isInitialLoading ? (
          <View style={topCreatorsStyle.listGap}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
              <CreatorCardSkeleton key={index} />
            ))}
          </View>
        ) : isInitialError ? (
          <CreatorsEmptyState variant="error" onRetry={retry} style={topCreatorsStyle.listGap} />
        ) : (
          <FlatList
            data={creators}
            keyExtractor={item => item.userId}
            renderItem={renderItem}
            style={layoutStyle.screen}
            contentContainerStyle={topCreatorsStyle.listGap}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={hasMore ? loadMore : undefined}
            ListEmptyComponent={<CreatorsEmptyState variant="empty" />}
            ListFooterComponent={
              isLoadingMore ? (
                <CreatorCardSkeleton />
              ) : isLoadMoreError ? (
                <CreatorsEmptyState variant="error" onRetry={retry} />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
