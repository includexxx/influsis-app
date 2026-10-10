import { PickedImageAsset } from '@/utils/onboardingSchemas';

// Campaign API group CI - the creator delivering an accepted engagement's
// pieces (backend 18g/18h/18m). Mirrors EngagementDeliverablePieceDto (CI1),
// DeliverableSubmissionSummaryDto, and the CI2/CI4 bodies.

// Piece statuses (backend CAMPAIGN_APPLICATION_DELIVERABLE_STATUSES).
export type DeliverablePieceStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'escalated'
  | 'cancelled';

export type DeliverableSubmissionStatus =
  | 'submitted'
  | 'approved'
  | 'changes_requested'
  | 'superseded'
  | 'withdrawn';

// One revision of a piece. Exactly one of `mediaId` / `externalUrl` is set.
// An uploaded image comes back as `mediaId` only - the backend exposes no URL
// for it, so it can't be previewed.
export interface DeliverableSubmission {
  id: string;
  revisionNo: number;
  submittedByUserId: string | null;
  submittedAt: string;
  isLate: boolean;
  mediaId: string | null;
  externalUrl: string | null;
  caption: string | null;
  livePostUrl: string | null;
  postedAt: string | null;
  status: DeliverableSubmissionStatus;
  reviewDecision: 'approved' | 'changes_requested' | null;
  reviewReason: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewDueAt: string;
}

// CI1 - one piece of content the creator owes: the negotiated scope item's
// count expanded into numbered pieces on acceptance.
export interface DeliverablePiece {
  id: string;
  scopeItemId: string;
  deliverableId: string | null;
  platform: string;
  type: string;
  /** The custom item's title (18q); `null` for catalogue pieces. */
  title: string | null;
  pieceNo: number;
  status: DeliverablePieceStatus;
  /** `YYYY-MM-DD`, frozen from the campaign's content deadline. */
  dueDate: string | null;
  revisionCount: number;
  rejectionCount: number;
  /** `max(0, MAX_DELIVERABLE_REJECTIONS - rejectionCount)` - the backend's
   * limit, 2 since backend 703e233 (original + one revision). */
  revisionsRemaining: number;
  escalatedAt: string | null;
  escalationReason: string | null;
  lastSubmittedAt: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  /** `revisionNo` ascending. */
  submissions: DeliverableSubmission[];
}

// CI2 - a link or an image, never both, plus an optional caption.
export type SubmitDeliverableArgs = {
  engagementId: string;
  pieceId: string;
  /** Up to 2000 characters. */
  caption?: string;
} & ({ kind: 'link'; externalUrl: string } | { kind: 'image'; image: PickedImageAsset });

// CI4 - where the approved content went live.
export interface RecordPostedArgs {
  engagementId: string;
  pieceId: string;
  livePostUrl: string;
}
