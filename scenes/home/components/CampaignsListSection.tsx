import { View } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetTopCampaignsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import {
  CampaignCardSkeleton,
  CampaignsEmptyState,
  FeedCampaignCard,
} from '@/scenes/campaigns/components';
import { CampaignFeedFilters } from '@/scenes/campaigns/types/campaignFeed';

export interface CampaignsListSectionProps {
  /** Optional CB1 filters/sort; omitted, the backend default (newest first) applies. */
  filters?: CampaignFeedFilters;
  onSeeAllPress?: () => void;
  onCampaignPress?: (id: string) => void;
}

// Home screen's full-width "Campaigns" list (Figma node 6121:6627 and
// siblings) - the first CAMPAIGNS_PREVIEW_LIMIT campaigns from the creator
// campaign feed (campaign API group CB1, GET /feed/campaigns: every live
// campaign with an open application deadline). "See all" pushes the full
// virtualized list (scenes/campaigns/Campaigns.tsx), which reads the same
// feed one page at a time.
function CampaignsListSection({
  filters,
  onSeeAllPress,
  onCampaignPress,
}: CampaignsListSectionProps) {
  const { currentData, isFetching, isError, refetch } = useGetTopCampaignsQuery({
    ...filters,
    limit: CAMPAIGNS_PREVIEW_LIMIT,
  });
  // `currentData` + `isFetching` (not `data` + `isLoading`) so a filter change
  // shows skeletons instead of the previous filter's campaigns.
  const isLoading = isFetching && !currentData;
  const campaigns = currentData ?? [];

  return (
    <View>
      <SectionHeader
        title="Campaigns"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <CampaignsEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && campaigns.length === 0 ? (
        <CampaignsEmptyState variant="empty" />
      ) : (
        <View style={homeStyle.campaignListGap}>
          {isLoading
            ? Array.from({ length: CAMPAIGNS_PREVIEW_LIMIT }, (_, index) => (
                <CampaignCardSkeleton key={index} variant="list" />
              ))
            : campaigns.map(item => (
                <FeedCampaignCard key={item.id} campaign={item} onPress={onCampaignPress} />
              ))}
        </View>
      )}
    </View>
  );
}

export default CampaignsListSection;
