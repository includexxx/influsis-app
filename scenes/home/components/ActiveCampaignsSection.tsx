import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { homeStyle } from '@/styles';
import SectionHeader from '@/components/elements/SectionHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetTopRecommendedCampaignsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import { mapCampaignFeedItemToCard } from '@/scenes/campaigns/utils/mapCampaignFeedItem';
import { CampaignCardSkeleton, CampaignsEmptyState } from '@/scenes/campaigns/components';

export interface ActiveCampaignsSectionProps {
  onSeeAllPress?: () => void;
  onCampaignPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  heroCard: {
    width: 370,
  },
});

// Home screen's "Active Campaigns" hero carousel (Figma node 6121:6522) -
// the first CAMPAIGNS_PREVIEW_LIMIT campaigns from the creator's recommended
// feed (campaign API group CB4, GET /feed/campaigns/recommended). "See all"
// pushes the full virtualized list (scenes/campaigns/LiveCampaign.tsx),
// which reads the same feed one page at a time.
function ActiveCampaignsSection({
  onSeeAllPress,
  onCampaignPress,
  style,
}: ActiveCampaignsSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopRecommendedCampaignsQuery({
    limit: CAMPAIGNS_PREVIEW_LIMIT,
  });
  const campaigns = data ?? [];

  return (
    <View style={style}>
      <SectionHeader
        title="Active Campaigns"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <CampaignsEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && campaigns.length === 0 ? (
        <CampaignsEmptyState variant="empty" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.row, homeStyle.horizontalListGap]}>
            {isLoading
              ? Array.from({ length: CAMPAIGNS_PREVIEW_LIMIT }, (_, index) => (
                  <CampaignCardSkeleton key={index} variant="hero" style={styles.heroCard} />
                ))
              : campaigns.map(item => (
                  <CampaignCard
                    key={item.id}
                    variant="hero"
                    style={styles.heroCard}
                    {...mapCampaignFeedItemToCard(item)}
                    onPress={() => onCampaignPress?.(item.id)}
                  />
                ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default ActiveCampaignsSection;
