import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { palette } from '@/theme';
import Button from '@/components/elements/Button';
import StarRating from '@/components/elements/StarRating';
import { reviewBusinessStyle as s } from '../reviewBusiness.style';
import { EngagementReviewState } from '../types/review';
import { businessLabel, reviewCardState, reviewVisibilityLine } from '../utils/review';

const starIcon = require('@/assets/images/profile/star-rating.png');

export interface EngagementReviewCardProps {
  state: EngagementReviewState;
  /** The business's name when known (CB2); falls back to "the business". */
  business?: string | null;
  onOpen: () => void;
}

// The Offer screen's review section for a completed engagement (backend 23a,
// CK1): write a review, "they reviewed you - write yours to see it", where a
// submitted review stands under the blind reveal, or both ratings once
// revealed. Renders nothing before completion.
function EngagementReviewCard({ state, business, onOpen }: EngagementReviewCardProps) {
  const { colors } = useTheme();
  const card = reviewCardState(state);
  if (card.kind === 'none') return null;

  const name = businessLabel(business);
  const Name = name.charAt(0).toUpperCase() + name.slice(1);

  let title: string;
  let body: string | null = null;
  let action = 'Write a review';
  if (card.kind === 'write') {
    title = card.theyReviewed ? `${Name} reviewed you` : `How was working with ${name}?`;
    body = card.theyReviewed && !card.theirs ? 'Write yours to see it.' : null;
  } else if (card.kind === 'submitted-blind') {
    title = 'Review submitted';
    body = reviewVisibilityLine(card.mine, state.revealAt, business);
    action = 'View your review';
  } else {
    title = 'Reviews';
    action = 'Read reviews';
  }

  return (
    <View
      style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="offer-review">
      <View style={s.sectionHead}>
        <Feather name="star" size={18} color={palette.primary[500]} />
        <Text style={[s.sectionTitle, { color: colors.text.primary }]}>{title}</Text>
      </View>
      {body ? (
        <Text style={[s.hint, { color: colors.text.secondary }]} testID="offer-review-body">
          {body}
        </Text>
      ) : null}
      {card.kind === 'revealed' ? (
        <View style={s.block}>
          <RatingLine label="You rated them" rating={card.mine.rating} />
          <RatingLine label={`${Name} rated you`} rating={card.theirs.rating} />
        </View>
      ) : null}
      <Button
        title={action}
        style={s.primaryButton}
        titleStyle={s.primaryTitle}
        onPress={onOpen}
        accessibilityLabel={action}
        testID="offer-review-open"
      />
    </View>
  );
}

function RatingLine({ label, rating }: { label: string; rating: number }) {
  const { colors } = useTheme();
  return (
    <View style={s.block}>
      <Text style={[s.hint, { color: colors.text.secondary }]}>{label}</Text>
      <StarRating
        rating={rating}
        icon={starIcon}
        starSize={18}
        label={`${rating}/5`}
        accessibilityLabel={`${label}: ${rating} out of 5 stars`}
      />
    </View>
  );
}

export default EngagementReviewCard;
