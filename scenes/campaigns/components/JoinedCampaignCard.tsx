import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import CampaignCard, { CampaignCardVariant } from '@/components/elements/CampaignCard';
import { mapJoinedCampaignToCard } from '../utils/mapJoinedCampaign';
import { MyEngagementItem } from '../types/myEngagement';

export interface JoinedCampaignCardProps {
  engagement: MyEngagementItem;
  variant?: Exclude<CampaignCardVariant, 'applied'>;
  /** Called with the campaign's id (not the engagement's). */
  onPress?: (campaignId: string) => void;
  style?: StyleProp<ViewStyle>;
}

// A CampaignCard for one campaign the logged-in creator has joined (a
// GET /me/engagements row) - Home's "Active Campaigns" section and the full
// Live Campaigns screen. Memoized since the full list re-renders on every
// page load.
function JoinedCampaignCard({
  engagement,
  variant = 'list',
  onPress,
  style,
}: JoinedCampaignCardProps) {
  return (
    <CampaignCard
      variant={variant}
      {...mapJoinedCampaignToCard(engagement)}
      onPress={onPress ? () => onPress(engagement.campaignId) : undefined}
      style={style}
      testID={`joined-campaign-${engagement.id}`}
    />
  );
}

export default memo(JoinedCampaignCard);
