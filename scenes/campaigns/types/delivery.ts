import { CampaignObjective } from './campaignFeed';
import { DeliverablePieceStatus } from './deliverables';

// Campaign API group CI, delivery rounds (backend 18r1-18r3): an accepted
// engagement's pieces are delivered together as one round and reviewed as a
// whole - draft rounds until one is approved, then the final round. Since the
// backend fix of 2026-10-11 the final can't be sent back: the business
// approves it, or the system does 72 hours after submission. Mirrors
// EngagementDeliveryDto (GET /engagements/:id/delivery) and the round body
// (POST /engagements/:id/delivery/rounds). See backend
// docs/features/campaign/implementations/CI_DELIVERY_ROUNDS.md.

// Computed by the backend on every read from the latest round; `escalated`
// wins over every other stage. `null` = the engagement isn't in delivery.
export type DeliveryStage =
  | 'awaiting_draft'
  | 'draft_in_review'
  | 'draft_changes_requested'
  | 'awaiting_final'
  | 'final_in_review'
  | 'delivered'
  | 'escalated';

export type DeliveryPhase = 'draft' | 'final';
export type DeliveryRoundStatus = 'submitted' | 'approved' | 'changes_requested';

// What a piece's final item must be (36b).
export type DeliveryFinalKind = 'file_link' | 'live_post';

export interface DeliveryPiece {
  id: string;
  scopeItemId: string;
  platform: string;
  type: string;
  /** The custom item's title (18q); `null` for catalogue pieces. */
  title: string | null;
  pieceNo: number;
  /** `YYYY-MM-DD`, frozen from the campaign's content deadline. */
  dueDate: string | null;
  /** Follows the piece's latest round item. */
  status: DeliverablePieceStatus;
  finalKind: DeliveryFinalKind;
}

// One piece's content in a round. Exactly one of `mediaId` / `externalUrl`
// is set; an uploaded image has no URL to preview. `externalUrl`, `caption`
// and `reviewComment` are user text: render escaped, open only http(s).
export interface DeliveryRoundItem {
  id: string;
  pieceId: string;
  revisionNo: number;
  mediaId: string | null;
  externalUrl: string | null;
  livePostUrl: string | null;
  caption: string | null;
  /** The business's comment on this piece, from the round's review. */
  reviewComment: string | null;
  status: string;
  reusedFromSubmissionId: string | null;
}

export interface DeliveryRound {
  id: string;
  phase: DeliveryPhase;
  /** Counted per phase. */
  roundNo: number;
  status: DeliveryRoundStatus;
  /** Created by the 18r1 migration from per-piece history. */
  converted: boolean;
  submittedAt: string;
  isLate: boolean;
  /** For the final: submittedAt + 72 hours, when it's approved automatically. */
  reviewDueAt: string;
  reviewDecision: 'approved' | 'changes_requested' | null;
  /** The business's overall reason when it requested changes. */
  reviewReason: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  /** The system approved this final because the business didn't in 72 hours. */
  autoApproved: boolean;
  items: DeliveryRoundItem[];
}

export interface EngagementDelivery {
  stage: DeliveryStage | null;
  /** `null` for a campaign created before 18q. */
  objective: CampaignObjective | null;
  /** Draft budget: `max(0, 2 - draftChangeRequests)`, 2 -> 1 -> 0. */
  revisionsRemaining: number;
  draftChangeRequests: number;
  escalatedAt: string | null;
  /** Backend wording, not shown to the creator. */
  escalationReason: string | null;
  pieces: DeliveryPiece[];
  /** Drafts, then finals, each oldest first. */
  rounds: DeliveryRound[];
}

// One item of a round body: exactly one content source per piece.
export type SubmitRoundItem = { pieceId: string; caption?: string } & (
  | { mediaId: string }
  | { externalUrl: string }
  | { reuseItemId: string }
);

export interface SubmitRoundArgs {
  engagementId: string;
  /** One per non-cancelled piece. */
  items: SubmitRoundItem[];
}
