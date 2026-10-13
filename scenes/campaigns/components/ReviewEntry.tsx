import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { palette } from '@/theme';
import StarRating from '@/components/elements/StarRating';
import { reviewBusinessStyle as s } from '../reviewBusiness.style';
import { EngagementReview } from '../types/review';
import { formatOfferDate } from '../utils/negotiation';

const starIcon = require('@/assets/images/profile/star-rating.png');

export interface ReviewEntryProps {
  title: string;
  review: EngagementReview;
  testID?: string;
}

// One engagement review (backend 23a): the stars, the plain-text message and
// when it was written. An admin-hidden review keeps its content for the two
// parties, with a "Hidden by Influsis" note - it is never shown as deleted.
function ReviewEntry({ title, review, testID }: ReviewEntryProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID={testID}>
      <Text style={[s.cardTitle, { color: colors.text.primary }]}>{title}</Text>
      <StarRating
        rating={review.rating}
        icon={starIcon}
        starSize={18}
        label={`${review.rating}/5`}
        accessibilityLabel={`${review.rating} out of 5 stars`}
      />
      <Text style={[s.message, { color: colors.text.primary }]}>{review.message}</Text>
      <Text style={[s.meta, { color: colors.text.secondary }]}>
        {formatOfferDate(review.submittedAt)}
      </Text>
      {review.hidden ? (
        <View style={s.hiddenNote} testID={testID ? `${testID}-hidden` : undefined}>
          <Feather name="eye-off" size={13} color={palette.gray[500]} />
          <Text style={s.hiddenText}>Hidden by Influsis</Text>
        </View>
      ) : null}
    </View>
  );
}

export default ReviewEntry;
