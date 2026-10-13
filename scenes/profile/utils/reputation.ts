import {
  CreatorReputation,
  ProfileReview,
  ReputationBrief,
} from '@/scenes/creator/types/creatorDirectory';

const UNKNOWN = '—';

export interface ProfileStats {
  rating: string;
  ratingLabel: string;
  projects: string;
}

// The Rating and Projects columns of My Profile's stat strip (backend 23b
// `reputation`, read from the creator's own E4 profile). A null average means
// no visible reviews yet - "New", never 0 stars; an average of 0 is a real
// rating. Without `reputation` (not discoverable, still loading, or the read
// failed) both columns show "—".
export function profileStats({
  discoverable,
  reputation,
}: {
  discoverable: boolean;
  reputation: CreatorReputation | null | undefined;
}): ProfileStats {
  if (!discoverable || !reputation) {
    return { rating: UNKNOWN, ratingLabel: 'Rating', projects: UNKNOWN };
  }
  const projects = String(reputation.completedEngagements);
  if (reputation.averageRating === null) {
    return { rating: 'New', ratingLabel: 'No ratings yet', projects };
  }
  return { rating: String(reputation.averageRating), ratingLabel: 'Rating', projects };
}

// The rating brief on a directory card (E1/E3 `reputation`): "4.5 (12)", or
// "New" with no visible reviews. 0 is a real average.
export function reputationBrief(brief: ReputationBrief): {
  text: string;
  accessibilityLabel: string;
} {
  if (brief.averageRating === null) return { text: 'New', accessibilityLabel: 'No ratings yet' };
  const reviews = `${brief.reviewCount} ${brief.reviewCount === 1 ? 'review' : 'reviews'}`;
  return {
    text: `${brief.averageRating} (${brief.reviewCount})`,
    accessibilityLabel: `Rated ${brief.averageRating} from ${reviews}`,
  };
}

/** Who wrote a review: businesses review creators (CK3), creators review businesses (CK4). */
export type ReviewerKind = 'business' | 'creator';

// Where a reviewer row opens, or null when it shouldn't: a "Former Influsis
// member" (gone account) or a creator who isn't discoverable has no handle,
// and their page would 404.
export function reviewerHref(
  reviewer: ProfileReview['reviewer'],
  kind: ReviewerKind,
): `/business/${string}` | `/creator/${string}` | null {
  if (!reviewer.handle) return null;
  return kind === 'business' ? `/business/${reviewer.userId}` : `/creator/${reviewer.userId}`;
}
