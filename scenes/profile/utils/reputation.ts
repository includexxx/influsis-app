import { CreatorReputation } from '@/scenes/creator/types/creatorDirectory';

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
