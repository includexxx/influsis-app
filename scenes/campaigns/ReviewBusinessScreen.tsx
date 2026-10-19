import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import { palette } from '@/theme';
import { ApiError } from '@/services/http';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import ScreenHeader from '@/components/elements/ScreenHeader';
import StarRatingInput from '@/components/elements/StarRatingInput';
import ItemUnavailable from '@/components/elements/ItemUnavailable';
import { reviewBusinessStyle as s } from './reviewBusiness.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import ReviewEntry from './components/ReviewEntry';
import {
  useGetEngagementReviewsQuery,
  useSubmitEngagementReviewMutation,
} from './api/campaignFeedApi';
import { EngagementReviewState } from './types/review';
import {
  applyReviewError,
  businessLabel,
  REVIEW_MESSAGE_MAX_LENGTH,
  reviewCardState,
  reviewDefaultValues,
  reviewSchema,
  ReviewValues,
  reviewVisibilityLine,
  toReviewPayload,
} from './utils/review';

// The Review screen (backend 23a, build-plan 37a) - pushed from the Offer
// screen's review section, the Deliverables screen's "Rate {business}" and
// Home's "Reviews to write". Registered as
// app/(details)/engagement/[id]/review.tsx. `title` (campaign) and
// `business` (name) ride along because CK1 carries neither.
//
// Reads CK1 and shows one of: the "not completed yet" notice, the form
// (CK2), or the creator's submitted review with where it stands under the
// blind reveal, plus the business's review once it is visible. A 409 from
// CK2 (already reviewed, or not completed) refetches CK1, which moves the
// screen to the matching state. Review text is plain - rendered with <Text>.
export default function ReviewBusinessScreen() {
  const { colors } = useTheme();
  const { id, title, business } = useLocalSearchParams<{
    id: string;
    title?: string;
    business?: string;
  }>();
  const engagementId = id ?? '';
  const { data, isLoading, isError, error, refetch } = useGetEngagementReviewsQuery(
    { engagementId },
    { skip: !engagementId },
  );

  if (!engagementId) {
    return <Redirect href="/home" />;
  }

  const name = businessLabel(business);

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Review" onBack={() => router.back()} style={s.headerGap} />

        {isLoading ? (
          <View testID="review-loading">
            <CampaignRequestCardSkeleton />
          </View>
        ) : error?.code === 'NOT_FOUND' ? (
          <ItemUnavailable />
        ) : isError || !data ? (
          <CampaignsEmptyState variant="error" onRetry={refetch} />
        ) : (
          <View style={s.content}>
            <View style={s.block}>
              {title ? <Text style={s.eyebrow}>{title.toUpperCase()}</Text> : null}
              <Text style={[s.heading, { color: colors.text.primary }]}>Rate {name}</Text>
            </View>
            <ReviewContent
              engagementId={engagementId}
              state={data}
              business={business}
              onConflict={refetch}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewContent({
  engagementId,
  state,
  business,
  onConflict,
}: {
  engagementId: string;
  state: EngagementReviewState;
  business?: string;
  onConflict: () => void;
}) {
  const { colors } = useTheme();
  const card = reviewCardState(state);
  const name = businessLabel(business);
  const theirsTitle = `${name.charAt(0).toUpperCase()}${name.slice(1)}'s review of you`;

  if (card.kind === 'none') {
    return (
      <Note icon="clock" testID="review-not-open">
        Reviews open once the engagement is completed.
      </Note>
    );
  }

  if (card.kind === 'write') {
    return (
      <>
        {card.theyReviewed && !card.theirs ? (
          <Note icon="eye-off" testID="review-they-reviewed">
            {name.charAt(0).toUpperCase() + name.slice(1)} reviewed you. Write yours to see it.
          </Note>
        ) : null}
        <ReviewForm engagementId={engagementId} onConflict={onConflict} />
        {card.theirs ? (
          <ReviewEntry title={theirsTitle} review={card.theirs} testID="review-theirs" />
        ) : null}
      </>
    );
  }

  return (
    <>
      <ReviewEntry title="Your review" review={card.mine} testID="review-mine" />
      <Text style={[s.hint, { color: colors.text.secondary }]} testID="review-visibility">
        {reviewVisibilityLine(card.mine, state.revealAt, business)}
      </Text>
      {card.kind === 'revealed' ? (
        <ReviewEntry title={theirsTitle} review={card.theirs} testID="review-theirs" />
      ) : null}
    </>
  );
}

function ReviewForm({
  engagementId,
  onConflict,
}: {
  engagementId: string;
  onConflict: () => void;
}) {
  const { colors } = useTheme();
  const [submitReview] = useSubmitEngagementReviewMutation();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: reviewDefaultValues,
  });
  const messageLength = watch('message').length;

  async function onSubmit(values: ReviewValues) {
    clearErrors('root');
    try {
      // Success refetches CK1 (tags), which swaps this form for the
      // submitted review - and shows theirs too when both are now revealed.
      await submitReview({ engagementId, ...toReviewPayload(values) }).unwrap();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        onConflict();
        return;
      }
      applyReviewError(err, setError);
    }
  }

  return (
    <View style={s.content}>
      <View style={s.block}>
        <Text style={[s.label, { color: colors.text.primary }]}>Your rating</Text>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              testID="review-rating"
            />
          )}
        />
        {errors.rating?.message ? (
          <Text accessibilityRole="alert" style={s.fieldError} testID="review-rating-error">
            {errors.rating.message}
          </Text>
        ) : null}
      </View>

      <View style={s.block}>
        <Text style={[s.label, { color: colors.text.primary }]}>Your review</Text>
        <ControlledTextField
          control={control}
          name="message"
          placeholder="What was it like working with them?"
          accessibilityLabel="Your review"
          multiline
          maxLength={REVIEW_MESSAGE_MAX_LENGTH}
          editable={!isSubmitting}
          inputStyle={s.textarea}
          testID="review-message"
        />
        <Text style={[s.counter, { color: colors.text.secondary }]} testID="review-counter">
          {messageLength}/{REVIEW_MESSAGE_MAX_LENGTH}
        </Text>
      </View>

      <Note icon="lock" testID="review-final-note">
        Reviews can&apos;t be edited or deleted after you submit.
      </Note>

      {errors.root?.message ? (
        <Text accessibilityRole="alert" style={s.rootError} testID="review-error">
          {errors.root.message}
        </Text>
      ) : null}

      <Button
        title="Submit review"
        style={sharedButton.primary}
        titleStyle={sharedButton.primaryTitle}
        onPress={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        disabled={isSubmitting}
        testID="review-submit"
      />
    </View>
  );
}

function Note({
  icon,
  children,
  testID,
}: {
  icon: 'clock' | 'eye-off' | 'lock';
  children: ReactNode;
  testID?: string;
}) {
  return (
    <View style={s.note} testID={testID}>
      <Feather name={icon} size={16} color={palette.primaryNavy[800]} />
      <Text style={s.noteText}>{children}</Text>
    </View>
  );
}
