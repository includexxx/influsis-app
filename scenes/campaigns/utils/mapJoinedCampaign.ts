import { ImageSourcePropType } from 'react-native';
import { CampaignCardProps } from '@/components/elements/CampaignCard';
import { resolveMediaKeyOrUrl } from '@/utils/media';
import { MyEngagementItem } from '../types/myEngagement';
import { formatCampaignDueDate, formatCampaignPrice } from './mapCampaignFeedItem';

function toRemoteSource(keyOrUrl: string | null | undefined): ImageSourcePropType | null {
  const url = resolveMediaKeyOrUrl(keyOrUrl);
  return url ? { uri: url } : null;
}

export type JoinedCampaignCardProps = Pick<
  CampaignCardProps,
  'image' | 'businessAvatar' | 'title' | 'price' | 'dueDate'
>;

// Maps one joined engagement (GET /me/engagements row) onto CampaignCard's
// props. For work the creator has joined, the relevant money is the agreed
// fee (falling back to the campaign budget before one is set) and the
// relevant date is when content is due (falling back to the application
// deadline). The row's campaign summary has no business name, so the card
// shows none.
export function mapJoinedCampaignToCard(engagement: MyEngagementItem): JoinedCampaignCardProps {
  const campaign = engagement.campaign;
  return {
    image: toRemoteSource(campaign?.coverUrl),
    businessAvatar: toRemoteSource(campaign?.avatarUrl),
    title: campaign?.title ?? 'Untitled campaign',
    price: formatCampaignPrice(
      engagement.agreedAmountMinor ?? campaign?.budgetAmountMinor ?? null,
      engagement.currency,
    ),
    dueDate: formatCampaignDueDate(
      campaign?.contentDeadline ?? campaign?.applicationDeadline ?? null,
    ),
  };
}
