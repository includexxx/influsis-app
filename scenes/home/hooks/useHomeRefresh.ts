import { useCallback, useState } from 'react';
import { useGetMyProfileQuery } from '@/services/profilesApi';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetCreatorEarningsQuery,
  useGetTopCampaignsQuery,
  useGetTopJoinedCampaignsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import {
  BUSINESSES_PREVIEW_LIMIT,
  useGetTopBusinessesQuery,
} from '@/scenes/business/api/businessDirectoryApi';
import {
  CREATORS_PREVIEW_LIMIT,
  useGetTopCreatorsQuery,
} from '@/scenes/creator/api/creatorDirectoryApi';

// Pull-to-refresh for Home. Subscribes to the same cache entries the
// sections read (same endpoints, same args - RTK Query shares them, so this
// adds no requests) and refetches them all, reporting `refreshing` until
// every one has settled. A failed refetch is left to its section's own error
// state.
export function useHomeRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const profile = useGetMyProfileQuery();
  const earnings = useGetCreatorEarningsQuery();
  const joined = useGetTopJoinedCampaignsQuery({ limit: CAMPAIGNS_PREVIEW_LIMIT });
  const campaigns = useGetTopCampaignsQuery({ limit: CAMPAIGNS_PREVIEW_LIMIT });
  const businesses = useGetTopBusinessesQuery({ limit: BUSINESSES_PREVIEW_LIMIT });
  const creators = useGetTopCreatorsQuery({ limit: CREATORS_PREVIEW_LIMIT });

  const { refetch: refetchProfile } = profile;
  const { refetch: refetchEarnings } = earnings;
  const { refetch: refetchJoined } = joined;
  const { refetch: refetchCampaigns } = campaigns;
  const { refetch: refetchBusinesses } = businesses;
  const { refetch: refetchCreators } = creators;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refetchProfile(),
        refetchEarnings(),
        refetchJoined(),
        refetchCampaigns(),
        refetchBusinesses(),
        refetchCreators(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchProfile,
    refetchEarnings,
    refetchJoined,
    refetchCampaigns,
    refetchBusinesses,
    refetchCreators,
  ]);

  return { refreshing, refresh, profile: profile.data };
}
