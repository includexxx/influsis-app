import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import CampaignCard, { CampaignCardVariant } from '@/components/elements/CampaignCard';
import { mapCampaignFeedItemToCard } from '../utils/mapCampaignFeedItem';
import { CampaignFeedItem } from '../types/campaignFeed';

export interface FeedCampaignCardProps {
  campaign: CampaignFeedItem;
  variant?: Exclude<CampaignCardVariant, 'applied'>;
  onPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

// A CampaignCard for one creator-feed row (CB1 GET /feed/campaigns or CB4
// GET /feed/campaigns/recommended), taking the backend row as-is so every
// feed screen (Home's two sections, Campaigns, Live Campaigns) renders a
// campaign the same way instead of each spreading mapper output into the
// generic card. Memoized since the full lists re-render on every page load.
function FeedCampaignCard({ campaign, variant = 'list', onPress, style }: FeedCampaignCardProps) {
  return (
    <CampaignCard
      variant={variant}
      {...mapCampaignFeedItemToCard(campaign)}
      onPress={onPress ? () => onPress(campaign.id) : undefined}
      style={style}
      testID={`feed-campaign-${campaign.id}`}
    />
  );
}

export default memo(FeedCampaignCard);
