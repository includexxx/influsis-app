import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { businessDetailsStyle } from '../businessDetails.style';
import { useCampaignsFeed } from '@/scenes/campaigns/hooks/useCampaignsFeed';
import {
  CampaignCardSkeleton,
  CampaignsEmptyState,
  FeedCampaignCard,
} from '@/scenes/campaigns/components';

export interface BusinessCampaignsSectionProps {
  /** The business's user id (the `:id` of this screen's route). */
  businessId: string;
}

const INITIAL_SKELETON_COUNT = 2;

const styles = StyleSheet.create({
  showMore: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  showMoreLabel: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
});

function openCampaign(id: string) {
  router.push(`/campaign/${id}`);
}

// Business Details' "Ongoing Campaign" section (Figma node 6001:37719): the
// business's live campaigns with an open application deadline, from the
// creator feed narrowed to this business (campaign API group CB1,
// GET /feed/campaigns?businessId=). Skeleton cards while the first page
// loads, a retryable error, and an empty state when the business has none.
// The list lives inside the screen's ScrollView, so it isn't virtualized -
// "Show more" loads the next page instead of an onEndReached trigger.
function BusinessCampaignsSection({ businessId }: BusinessCampaignsSectionProps) {
  const { palette, colors } = useTheme();
  const {
    campaigns,
    isInitialLoading,
    isLoadingMore,
    isInitialError,
    isLoadMoreError,
    hasMore,
    loadMore,
    retry,
  } = useCampaignsFeed({ businessId });

  return (
    <View testID="business-campaigns-section">
      <Text style={[businessDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
        Ongoing Campaign
      </Text>

      {isInitialLoading ? (
        <View style={businessDetailsStyle.campaignListGap}>
          {Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
            <CampaignCardSkeleton key={index} variant="list" />
          ))}
        </View>
      ) : isInitialError ? (
        <CampaignsEmptyState variant="error" onRetry={retry} />
      ) : campaigns.length === 0 ? (
        <CampaignsEmptyState variant="noBusinessCampaigns" />
      ) : (
        <View style={businessDetailsStyle.campaignListGap}>
          {campaigns.map(campaign => (
            <FeedCampaignCard key={campaign.id} campaign={campaign} onPress={openCampaign} />
          ))}

          {isLoadingMore ? (
            <CampaignCardSkeleton variant="list" />
          ) : isLoadMoreError ? (
            <CampaignsEmptyState variant="error" onRetry={retry} />
          ) : hasMore ? (
            <Pressable
              accessibilityRole="button"
              onPress={loadMore}
              style={styles.showMore}
              testID="business-campaigns-show-more">
              <Text style={[styles.showMoreLabel, { color: palette.primary[400] }]}>
                Show more campaigns
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default BusinessCampaignsSection;
