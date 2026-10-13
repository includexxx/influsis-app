import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/hooks';
import { useGetMyCampaignPortfolioPageQuery } from '@/scenes/campaigns/api/campaignFeedApi';
import { useCampaignFeedPages } from '@/scenes/campaigns/hooks/useCampaignsFeed';
import { myProfileStyle as s } from '../myProfile.style';
import CampaignWorkCard from './CampaignWorkCard';
import { ProfileNote, ShowMore } from './ProfileNote';

const NO_FILTERS = {};

// My Profile's "Campaign work" (backend 23c CK6): every completed campaign,
// hidden ones included, ten at a time. Not affected by discoverability.
function CampaignWorkSection() {
  const { colors } = useTheme();
  const work = useCampaignFeedPages(useGetMyCampaignPortfolioPageQuery, NO_FILTERS);

  if (work.isInitialLoading) {
    return <ActivityIndicator color={colors.primary} testID="campaign-work-loading" />;
  }
  if (work.isInitialError) {
    return (
      <ProfileNote
        icon="alert-circle"
        text="Couldn't load your campaign work."
        onRetry={work.retry}
        testID="campaign-work-error"
      />
    );
  }
  if (!work.campaigns.length) {
    return (
      <ProfileNote
        icon="briefcase"
        text="Your completed campaigns will show up here."
        testID="campaign-work-empty"
      />
    );
  }

  return (
    <View style={s.listGap}>
      {work.campaigns.map(entry => (
        <CampaignWorkCard key={entry.engagementId} entry={entry} />
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

export default CampaignWorkSection;
