import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { resolveMediaUrl } from '@/utils/media';
import ReviewCard from '@/components/elements/ReviewCard';
import { ProfileReview } from '@/scenes/creator/types/creatorDirectory';
import { useCampaignFeedPages, UseFeedPageQuery } from '@/scenes/campaigns/hooks/useCampaignsFeed';
import { formatOfferDate } from '@/scenes/campaigns/utils/negotiation';
import { myProfileStyle as s } from '../myProfile.style';
import { reviewerHref, ReviewerKind } from '../utils/reputation';
import { ProfileNote, ShowMore } from './ProfileNote';

const avatarImage = require('@/assets/images/account/avatar.png');

export interface ReviewsListProps<A extends object> {
  /** One page of CK3 (reviews of a creator) or CK4 (reviews of a business). */
  useQuery: UseFeedPageQuery<ProfileReview, A>;
  args: A;
  /** Who wrote these reviews - decides where a reviewer row opens. */
  reviewer: ReviewerKind;
  emptyText: string;
  errorText?: string;
  /** `${prefix}-reviews-loading|error|empty|show-more`, `${prefix}-review-${id}`. */
  testIDPrefix: string;
}

// A profile's received reviews (backend 23b CK3/CK4): visible and not
// hidden, newest first, ten at a time with "Show more". A reviewer with a
// handle opens their profile; a "Former Influsis member" or a creator who
// isn't discoverable has none and is plain text. Messages render as plain
// text. Used by My Profile, Creator Profile and Business Details.
function ReviewsList<A extends object>({
  useQuery,
  args,
  reviewer,
  emptyText,
  errorText = "Couldn't load reviews.",
  testIDPrefix,
}: ReviewsListProps<A>) {
  const { colors } = useTheme();
  const reviews = useCampaignFeedPages(useQuery, args);

  if (reviews.isInitialLoading) {
    return <ActivityIndicator color={colors.primary} testID={`${testIDPrefix}-reviews-loading`} />;
  }
  if (reviews.isInitialError) {
    return (
      <ProfileNote
        icon="alert-circle"
        text={errorText}
        onRetry={reviews.retry}
        testID={`${testIDPrefix}-reviews-error`}
      />
    );
  }
  if (!reviews.campaigns.length) {
    return (
      <ProfileNote
        icon="message-square"
        text={emptyText}
        testID={`${testIDPrefix}-reviews-empty`}
      />
    );
  }

  return (
    <View style={s.listGap}>
      {reviews.campaigns.map(review => {
        const avatar = resolveMediaUrl(review.reviewer.avatarUrl);
        const href = reviewerHref(review.reviewer, reviewer);
        const card = (
          <ReviewCard
            avatar={avatar ? { uri: avatar } : avatarImage}
            name={review.reviewer.displayName}
            rating={review.rating}
            timeAgo={formatOfferDate(review.submittedAt)}
            comment={review.message}
            testID={`${testIDPrefix}-review-${review.id}`}
          />
        );
        return (
          <View key={review.id}>
            {href ? (
              <Pressable
                accessibilityRole="link"
                accessibilityHint={`Opens ${review.reviewer.displayName}'s profile`}
                onPress={() => router.push(href)}
                testID={`${testIDPrefix}-reviewer-${review.id}`}>
                {card}
              </Pressable>
            ) : (
              card
            )}
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
        testID={`${testIDPrefix}-reviews-show-more`}
      />
    </View>
  );
}

export default ReviewsList;
