import { View } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetTopCampaignsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import { mapCampaignFeedItemToCard } from '@/scenes/campaigns/utils/mapCampaignFeedItem';
import { CampaignCardSkeleton, CampaignsEmptyState } from '@/scenes/campaigns/components';

export interface CampaignsListSectionProps {
  onSeeAllPress?: () => void;
  onCampaignPress?: (id: string) => void;
}

// Home screen's full-width "Campaigns" list (Figma node 6121:6627 and
// siblings) - the first CAMPAIGNS_PREVIEW_LIMIT campaigns from the creator
// campaign feed (campaign API group CB1, GET /feed/campaigns: every live
// campaign with an open application deadline). "See all" pushes the full
// virtualized list (scenes/campaigns/Campaigns.tsx), which reads the same
// feed one page at a time.
function CampaignsListSection({ onSeeAllPress, onCampaignPress }: CampaignsListSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopCampaignsQuery({
    limit: CAMPAIGNS_PREVIEW_LIMIT,
  });
  const campaigns = data ?? [];

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
                <CampaignCard
                  key={item.id}
                  variant="list"
                  {...mapCampaignFeedItemToCard(item)}
                  onPress={() => onCampaignPress?.(item.id)}
                />
              ))}
        </View>
      )}
    </View>
  );
}

export default CampaignsListSection;
