import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { palette, radius, spacing } from '@/theme';
import { resolveMediaKeyOrUrl } from '@/utils/media';
import Image from '@/components/elements/Image';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  CAMPAIGNS_PREVIEW_LIMIT,
  useGetPendingReviewsQuery,
} from '@/scenes/campaigns/api/campaignFeedApi';
import { PendingReview } from '@/scenes/campaigns/types/review';
import { homeStyle } from '../home.style';

export interface ReviewsToWriteSectionProps {
  /** Called with the pending review - Home opens its Review screen. */
  onReviewPress?: (review: PendingReview) => void;
  style?: StyleProp<ViewStyle>;
}

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initial: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary[50],
  },
  initialText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primary[500],
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    lineHeight: 19,
  },
  badge: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.primary[500],
  },
});

// Home's "Reviews to write" (backend 23b CK8, build-plan 37a): completed
// campaigns the creator hasn't reviewed yet, the first
// CAMPAIGNS_PREVIEW_LIMIT, newest first. The section stays out of the way -
// nothing renders while loading, on error, or when there's nothing to review.
// Each row opens that engagement's Review screen.
function ReviewsToWriteSection({ onReviewPress, style }: ReviewsToWriteSectionProps) {
  const { colors } = useTheme();
  const { data } = useGetPendingReviewsQuery({ page: 1, limit: CAMPAIGNS_PREVIEW_LIMIT });
  if (!data?.length) return null;

  return (
    <View style={style} testID="reviews-to-write">
      <SectionHeader
        title="Reviews to write"
        subtitle="Rate the businesses you've worked with"
        style={homeStyle.sectionHeaderGap}
      />
      <View style={styles.list}>
        {data.map(review => {
          const avatar = resolveMediaKeyOrUrl(review.counterparty.avatarUrl);
          const name = review.counterparty.displayName;
          return (
            <Pressable
              key={review.engagementId}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${name} for ${review.campaign.title}`}
              onPress={() => onReviewPress?.(review)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
              testID={`review-to-write-${review.engagementId}`}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.initial]}>
                  <Text style={styles.initialText}>{name.trim().charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.body}>
                <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                  Rate {name}
                </Text>
                <Text style={[styles.meta, { color: colors.text.secondary }]} numberOfLines={1}>
                  {review.campaign.title}
                </Text>
                {review.theirsSubmitted ? (
                  <Text style={styles.badge}>They&apos;ve reviewed you</Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.secondary} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default ReviewsToWriteSection;
