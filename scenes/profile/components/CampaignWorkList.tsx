import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/hooks';
import { useCampaignFeedPages, UseFeedPageQuery } from '@/scenes/campaigns/hooks/useCampaignsFeed';
import { PortfolioEntry, PublicPortfolioEntry } from '@/scenes/campaigns/types/portfolio';
import { myProfileStyle as s } from '../myProfile.style';
import CampaignWorkCard from './CampaignWorkCard';
import { ProfileNote, ShowMore } from './ProfileNote';

export interface CampaignWorkListProps<A extends object> {
  /** One page of CK6 (own, editable) or CK5 (another creator's, read-only). */
  useQuery: UseFeedPageQuery<PortfolioEntry | PublicPortfolioEntry, A>;
  args: A;
  /** The owner's view: each card gets the Hide/Show toggle. */
  editable: boolean;
  emptyText: string;
  errorText?: string;
}

// A creator's "Campaign work" (backend 23c): completed campaigns, newest
// first, ten at a time with "Show more". My Profile lists its own (CK6,
// hidden ones included, editable); Creator Profile lists another creator's
// public entries (CK5, read-only).
function CampaignWorkList<A extends object>({
  useQuery,
  args,
  editable,
  emptyText,
  errorText = "Couldn't load campaign work.",
}: CampaignWorkListProps<A>) {
  const { colors } = useTheme();
  const work = useCampaignFeedPages(useQuery, args);

  if (work.isInitialLoading) {
    return <ActivityIndicator color={colors.primary} testID="campaign-work-loading" />;
  }
  if (work.isInitialError) {
    return (
      <ProfileNote
        icon="alert-circle"
        text={errorText}
        onRetry={work.retry}
        testID="campaign-work-error"
      />
    );
  }
  if (!work.campaigns.length) {
    return <ProfileNote icon="briefcase" text={emptyText} testID="campaign-work-empty" />;
  }

  return (
    <View style={s.listGap}>
      {work.campaigns.map(entry => (
        <CampaignWorkCard key={entry.engagementId} entry={entry} editable={editable} />
      ))}
      <ShowMore
        label="Show more campaigns"
        hasMore={work.hasMore}
        isLoadingMore={work.isLoadingMore}
        isLoadMoreError={work.isLoadMoreError}
        onLoadMore={work.loadMore}
        onRetry={work.retry}
        testID="campaign-work-show-more"
      />
    </View>
  );
}

export default CampaignWorkList;
