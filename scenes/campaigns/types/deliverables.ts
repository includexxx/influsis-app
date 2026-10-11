// Campaign API group CI1 - an accepted engagement's pieces and every
// submission (backend 18g; read-only since 18r, which delivers all pieces as
// one round - see ./delivery.ts). Mirrors EngagementDeliverablePieceDto and
// DeliverableSubmissionSummaryDto as of 18r3.

// Piece statuses (backend CAMPAIGN_APPLICATION_DELIVERABLE_STATUSES).
export type DeliverablePieceStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
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
  lastSubmittedAt: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  /** `revisionNo` ascending. */
  submissions: DeliverableSubmission[];
}
