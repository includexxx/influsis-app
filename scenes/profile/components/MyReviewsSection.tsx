import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { resolveMediaUrl } from '@/utils/media';
import ReviewCard from '@/components/elements/ReviewCard';
import { useGetCreatorReviewsPageQuery } from '@/scenes/creator/api/creatorDirectoryApi';
import { useCampaignFeedPages } from '@/scenes/campaigns/hooks/useCampaignsFeed';
import { formatOfferDate } from '@/scenes/campaigns/utils/negotiation';
import { myProfileStyle as s } from '../myProfile.style';
import { ProfileNote, ShowMore } from './ProfileNote';

const avatarImage = require('@/assets/images/account/avatar.png');

// My Profile's "Reviews" list (backend 23b CK3): what businesses wrote about
// the creator, visible and not hidden, newest first, ten at a time. Mounted
// only for a discoverable creator - CK3 404s otherwise. Messages are plain
// text.
function MyReviewsSection({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const reviews = useCampaignFeedPages(useGetCreatorReviewsPageQuery, { userId });

  if (reviews.isInitialLoading) {
    return <ActivityIndicator color={colors.primary} testID="my-profile-reviews-loading" />;
  }
  if (reviews.isInitialError) {
    return (
      <ProfileNote
        icon="alert-circle"
        text="Couldn't load your reviews."
        onRetry={reviews.retry}
        testID="my-profile-reviews-error"
      />
    );
  }
  if (!reviews.campaigns.length) {
    return (
      <ProfileNote
        icon="message-square"
        text="No reviews yet. Reviews appear once a business's review of you is visible."
        testID="my-profile-reviews-empty"
      />
    );
  }

  return (
    <View style={s.listGap}>
      {reviews.campaigns.map(review => {
        const avatar = resolveMediaUrl(review.reviewer.avatarUrl);
        return (
          <View key={review.id}>
            <ReviewCard
              avatar={avatar ? { uri: avatar } : avatarImage}
              name={review.reviewer.displayName}
              rating={review.rating}
              timeAgo={formatOfferDate(review.submittedAt)}
              comment={review.message}
              testID={`my-profile-review-${review.id}`}
            />
            <Text style={[s.reviewCaption, { color: colors.text.secondary }]}>
              {review.campaign.title}
            </Text>
          </View>
        );
      })}
      <ShowMore
        label="Show more reviews"
        hasMore={reviews.hasMore}
        isLoadingMore={reviews.isLoadingMore}
        isLoadMoreError={reviews.isLoadMoreError}
        onLoadMore={reviews.loadMore}
        onRetry={reviews.retry}
        testID="my-profile-reviews-show-more"
      />
    </View>
  );
}

export default MyReviewsSection;
