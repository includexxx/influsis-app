import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetTopJoinedCampaignsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import {
  CampaignCardSkeleton,
  CampaignsEmptyState,
  JoinedCampaignCard,
} from '@/scenes/campaigns/components';

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
// the first CAMPAIGNS_PREVIEW_LIMIT campaigns the logged-in creator has
// joined (campaign API group CF2, GET /me/engagements?engagementStatus=
// accepted), or a "you haven't joined any campaigns" message. "See all"
// pushes the full virtualized list (scenes/campaigns/LiveCampaign.tsx),
// which reads the same list one page at a time.
function ActiveCampaignsSection({
  onSeeAllPress,
  onCampaignPress,
  style,
}: ActiveCampaignsSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopJoinedCampaignsQuery({
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
        <CampaignsEmptyState variant="noJoined" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.row, homeStyle.horizontalListGap]}>
            {isLoading
              ? Array.from({ length: CAMPAIGNS_PREVIEW_LIMIT }, (_, index) => (
                  <CampaignCardSkeleton key={index} variant="hero" style={styles.heroCard} />
                ))
              : campaigns.map(item => (
                  <JoinedCampaignCard
                    key={item.id}
                    engagement={item}
                    variant="hero"
                    style={styles.heroCard}
                    onPress={onCampaignPress}
                  />
                ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default ActiveCampaignsSection;
