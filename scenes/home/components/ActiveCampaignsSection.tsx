import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { homeStyle } from '../home.style';
import { MyEngagementItem } from '@/scenes/campaigns/types/myEngagement';
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
  /** Called with the joined engagement - Home opens its deliverables. */
  onCampaignPress?: (engagement: MyEngagementItem) => void;
  style?: StyleProp<ViewStyle>;
}

// layoutStyle.scrollContent's side gutter, and how much of the next card
// peeks in so the row reads as swipeable.
const GUTTER = 16;
const PEEK = 44;
const CARD_GAP = 12;
const MAX_CARD_WIDTH = 380;

const styles = StyleSheet.create({
  // Bleed to the screen edges so cards scroll under the gutter, while the
  // first card still lines up with the rest of Home.
  bleed: { marginHorizontal: -GUTTER },
  row: { paddingHorizontal: GUTTER, gap: CARD_GAP },
});

// Home screen's "Active Campaigns" hero carousel (Figma node 6121:6522) -
// the first CAMPAIGNS_PREVIEW_LIMIT campaigns the logged-in creator has
// joined (campaign API group CF2, GET /me/engagements?engagementStatus=
// accepted), or a "you haven't joined any campaigns" message. Cards size to
// the screen with the next one peeking in, and snap one at a time. "See all"
// pushes the full virtualized list (scenes/campaigns/LiveCampaign.tsx), which
// reads the same list one page at a time.
function ActiveCampaignsSection({
  onSeeAllPress,
  onCampaignPress,
  style,
}: ActiveCampaignsSectionProps) {
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = useGetTopJoinedCampaignsQuery({
    limit: CAMPAIGNS_PREVIEW_LIMIT,
  });
  const campaigns = data ?? [];
  const count = isLoading ? CAMPAIGNS_PREVIEW_LIMIT : campaigns.length;
  // A lone card takes the full width; several leave room for the peek.
  const cardWidth = Math.min(MAX_CARD_WIDTH, width - GUTTER * 2 - (count > 1 ? PEEK : 0));
  const cardStyle = { width: cardWidth };

  return (
    <View style={style}>
      <SectionHeader
        title="Active Campaigns"
        subtitle="Work you've agreed to deliver"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <CampaignsEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && campaigns.length === 0 ? (
        <CampaignsEmptyState variant="noJoined" />
      ) : (
        <ScrollView
          horizontal
          style={styles.bleed}
          contentContainerStyle={styles.row}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast">
          {isLoading
            ? Array.from({ length: CAMPAIGNS_PREVIEW_LIMIT }, (_, index) => (
                <CampaignCardSkeleton key={index} variant="hero" style={cardStyle} />
              ))
            : campaigns.map(item => (
                <JoinedCampaignCard
                  key={item.id}
                  engagement={item}
                  variant="hero"
                  style={cardStyle}
                  onPress={onCampaignPress}
                />
              ))}
        </ScrollView>
      )}
    </View>
  );
}

export default ActiveCampaignsSection;
