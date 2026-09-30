import { StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useAuthSlice } from '@/slices';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import { useGetCreatorEarningsQuery } from '@/scenes/campaigns/api/campaignFeedApi';
import { formatCampaignPrice } from '@/scenes/campaigns/utils/mapCampaignFeedItem';
import { formatMemberSince, getCreatorBadge } from '../utils/earningsCard';
import EarningsCard from './EarningsCard';

export interface EarningsSectionProps {
  style?: StyleProp<ViewStyle>;
}

// Home's earnings card, filled from real data:
// - total earned: agreed fees of completed engagements (useGetCreatorEarnings
//   in campaignFeedApi - there's no wallet endpoint yet); shows a
//   placeholder while loading and "—" if it fails, so the card never blocks
//   the rest of Home
// - handle / name and verification badge: GET /profiles/me (already cached
//   by the Profile tab)
// - "Creator since": the account's `createdAt` from the session
// The CTA opens the campaign list; Withdraw and Need help? open the existing
// withdraw flow and Help Center screens.
function EarningsSection({ style }: EarningsSectionProps) {
  const { account } = useAuthSlice();
  const { data: myProfile } = useGetMyProfileQuery();
  const { data: earnings, isError } = useGetCreatorEarningsQuery();

  const totalEarned = earnings
    ? formatCampaignPrice(earnings.totalMinor, earnings.currency)
    : isError
      ? '—'
      : null;
  const displayName = myProfile?.handle
    ? `@${myProfile.handle}`
    : (myProfile?.profile.name ?? 'Creator');
  const badge = getCreatorBadge(myProfile?.profile.verificationStatus);

  return (
    <EarningsCard
      totalEarned={totalEarned}
      displayName={displayName}
      memberSince={formatMemberSince(account?.createdAt)}
      badgeLabel={badge.label}
      badgeVerified={badge.verified}
      onCtaPress={() => router.push('/campaigns')}
      onWithdrawPress={() => router.push('/withdraw/method')}
      onHelpPress={() => router.push('/help-center')}
      style={style}
      testID="home-earnings-card"
    />
  );
}

export default EarningsSection;
