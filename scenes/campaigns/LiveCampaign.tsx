import { FlatList, ListRenderItem, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { liveCampaignStyle } from './liveCampaign.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import { CampaignCardSkeleton, CampaignsEmptyState, JoinedCampaignCard } from './components';
import { useJoinedCampaigns } from './hooks/useCampaignsFeed';
import { MyEngagementItem } from './types/myEngagement';

const INITIAL_SKELETON_COUNT = 4;

// Module-level so FlatList rows get a stable `renderItem`/`onPress`.
function openCampaign(id: string) {
  router.push(`/campaign/${id}`);
}

const renderItem: ListRenderItem<MyEngagementItem> = ({ item }) => (
  <JoinedCampaignCard engagement={item} onPress={openCampaign} />
);

// The Live Campaigns screen (Figma "Live campaigns", node 6111:6871), pushed
// from the Home tab's "Active Campaigns" section "See all" link
// (scenes/home/components/ActiveCampaignsSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group) since Figma
// shows no tab bar on this screen, the same reasoning as /notifications.
// Shows every campaign the logged-in creator has joined (campaign API group
// CF2, GET /me/engagements?engagementStatus=accepted) via a virtualized
// FlatList, or a "you haven't joined any campaigns" message.
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
  } = useJoinedCampaigns();

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
            ListEmptyComponent={<CampaignsEmptyState variant="noJoined" />}
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
