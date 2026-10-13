import { EngagementStatus } from './myEngagement';

// One side's review of a completed engagement (backend 23a). `rating` is
// 0-5 in half steps - 0 is a real rating, not "no review". `message` is
// plain text: render it with <Text>, never as HTML. `hidden` means an admin
// hid it from public lists (23d); both parties still see it.
export interface EngagementReview {
  id: string;
  direction: 'business_to_creator' | 'creator_to_business';
  rating: number;
  message: string;
  submittedAt: string;
  /** When the other side may see it (the blind reveal). */
  visibleAt: string;
  isVisible: boolean;
  hidden: boolean;
}

// Campaign API CK1, GET /engagements/:engagementId/reviews - callable for any
// engagement status. `theirs` is the other side's review only once visible;
// `theirsSubmitted` says it exists even while it is still blind.
export interface EngagementReviewState {
  engagementStatus: EngagementStatus;
  completedAt: string | null;
  /** `completedAt` + 7 days; null until the engagement is completed. */
  revealAt: string | null;
  canReview: boolean;
  mine: EngagementReview | null;
  theirs: EngagementReview | null;
  theirsSubmitted: boolean;
}

// Campaign API CK2, POST /engagements/:engagementId/reviews. The backend
// picks the direction from the caller.
export interface SubmitReviewArgs {
  engagementId: string;
  /** 0-5 in steps of 0.5. */
  rating: number;
  /** Trimmed, 10-2000 characters. */
  message: string;
}

// One row of campaign API CK8, GET /me/reviews/pending - a completed
// engagement the creator hasn't reviewed yet, newest first. A deleted
// account shows as "Former Influsis member".
export interface PendingReview {
  engagementId: string;
  completedAt: string;
  theirsSubmitted: boolean;
  campaign: { id: string; title: string };
  counterparty: { userId: string; displayName: string; avatarUrl: string | null };
}
