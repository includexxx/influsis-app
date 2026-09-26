import { useCallback } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { liveCampaignStyle } from './liveCampaign.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import { CampaignCardSkeleton, CampaignsEmptyState } from './components';
import { useRecommendedCampaignsFeed } from './hooks/useCampaignsFeed';
import { mapCampaignFeedItemToCard } from './utils/mapCampaignFeedItem';
import { CampaignFeedItem } from './types/campaignFeed';

const INITIAL_SKELETON_COUNT = 4;

// The Live Campaigns screen (Figma "Live campaigns", node 6111:6871), pushed
// from the Home tab's "Active Campaigns" section "See all" link
// (scenes/home/components/ActiveCampaignsSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group) since Figma
// shows no tab bar on this screen, the same reasoning as /notifications.
// Shows every campaign from the creator's recommended feed (campaign API
// group CB4, GET /feed/campaigns/recommended) via a virtualized FlatList,
// rather than the mock data/liveCampaigns.ts fixture this screen used
// before real backend wiring started.
export default function LiveCampaign() {
  const { colors } = useTheme();
  const {
    campaigns,
    isInitialLoading,
    isLoadingMore,
    isInitialError,
    isLoadMoreError,
    hasMore,
    loadMore,
    retry,
  } = useRecommendedCampaignsFeed();

  const renderItem: ListRenderItem<CampaignFeedItem> = useCallback(
    ({ item }) => (
      <CampaignCard
        variant="list"
        {...mapCampaignFeedItemToCard(item)}
        onPress={() => router.push(`/campaign/${item.id}`)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.screen}>
        <ScreenHeader
          title="Live Campaigns"
          onBack={() => router.back()}
          style={liveCampaignStyle.headerGap}
        />

        {isInitialLoading ? (
          <View style={liveCampaignStyle.listGap}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
              <CampaignCardSkeleton key={index} variant="list" />
            ))}
          </View>
        ) : isInitialError ? (
          <CampaignsEmptyState variant="error" onRetry={retry} style={liveCampaignStyle.listGap} />
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={layoutStyle.screen}
            contentContainerStyle={liveCampaignStyle.listGap}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={hasMore ? loadMore : undefined}
            ListEmptyComponent={<CampaignsEmptyState variant="empty" />}
            ListFooterComponent={
              isLoadingMore ? (
                <CampaignCardSkeleton variant="list" />
              ) : isLoadMoreError ? (
                <CampaignsEmptyState variant="error" onRetry={retry} />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
