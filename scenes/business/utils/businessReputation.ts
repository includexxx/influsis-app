import { CreatorReputation } from '@/scenes/creator/types/creatorDirectory';

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// Business Details' rating summary (backend 23b E2 `reputation`): "4.5 · 12
// reviews · 14 campaigns completed", or "New - no ratings yet · …" when no
// creator's review is visible yet (never 0 stars). `completedEngagements`
// counts completed engagements across the business's campaigns.
export function businessRatingSummary(reputation: CreatorReputation): string {
  const completed = plural(
    reputation.completedEngagements,
    'campaign completed',
    'campaigns completed',
  );
  if (reputation.averageRating === null) return `New - no ratings yet · ${completed}`;
  return [
    String(reputation.averageRating),
    plural(reputation.reviewCount, 'review', 'reviews'),
    completed,
  ].join(' · ');
}
