import { useCallback } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, campaignsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import { CampaignCardSkeleton, CampaignsEmptyState } from './components';
import { useCampaignsFeed } from './hooks/useCampaignsFeed';
import { mapCampaignFeedItemToCard } from './utils/mapCampaignFeedItem';
import { CampaignFeedItem } from './types/campaignFeed';

const INITIAL_SKELETON_COUNT = 4;

// The Campaigns screen (Figma "All Campaigns", node 6010:17065), pushed from
// the Home tab's "Campaigns" section "See all" link
// (scenes/home/components/CampaignsListSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group) since Figma
// shows no tab bar on this screen, the same reasoning as /notifications and
// /live-campaign. Shows every live campaign with an open application
// deadline (campaign API group CB1, GET /feed/campaigns) via a virtualized
// FlatList, rather than the mock data/campaigns.ts fixture this screen used
// before real backend wiring started.
export default function Campaigns() {
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
  } = useCampaignsFeed();

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
          title="Campaigns"
          onBack={() => router.back()}
          style={campaignsStyle.headerGap}
        />

        {isInitialLoading ? (
          <View style={campaignsStyle.listGap}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
              <CampaignCardSkeleton key={index} variant="list" />
            ))}
          </View>
        ) : isInitialError ? (
          <CampaignsEmptyState variant="error" onRetry={retry} style={campaignsStyle.listGap} />
        ) : (
          <FlatList
            data={campaigns}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={layoutStyle.screen}
            contentContainerStyle={campaignsStyle.listGap}
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
