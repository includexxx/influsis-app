import { PickedImageAsset } from '@/utils/onboardingSchemas';

import { DeliveryRound, EngagementDelivery, SubmitRoundItem } from '../types/delivery';
import {
  CAPTION_MAX_LENGTH,
  formatRevisionsLeft,
  pieceTitle,
  SubmissionField,
  validateSubmission,
} from './deliverables';

// Delivery rounds (backend 18r1-18r3, delivery-round-rules.ts): every piece
// is delivered together as one round. These helpers turn the delivery read
// into what the screens show and the slots into the round body. The server
// still has the final word on every rule.

// The newest final round, else the newest draft round - the round the
// backend computes `stage` from. Rounds arrive drafts first, then finals,
// each oldest first.
export function latestRound(delivery: Pick<EngagementDelivery, 'rounds'>): DeliveryRound | null {
  const finals = delivery.rounds.filter(round => round.phase === 'final');
  const drafts = delivery.rounds.filter(round => round.phase === 'draft');
  return finals[finals.length - 1] ?? drafts[drafts.length - 1] ?? null;
}

// Why the delivery is in dispute, from the engagement's change-request
// counts: the 2nd final or the 3rd draft change request escalates. Anything
// else (e.g. a conversion of a per-piece escalation) gets the generic line.
// The backend's `escalationReason` is internal wording and isn't shown.
export function escalationCopy(
  delivery: Pick<EngagementDelivery, 'draftChangeRequests' | 'finalChangeRequests'>,
): string {
  if (delivery.finalChangeRequests >= 2) {
    return 'The business requested changes to the final delivery twice.';
  }
  if (delivery.draftChangeRequests >= 3) {
    return `The business requested changes to the draft ${delivery.draftChangeRequests} times.`;
  }
  return 'This delivery was escalated to a dispute.';
}

export type DeliveryTone = 'neutral' | 'info' | 'warning' | 'success' | 'error';

export interface DeliveryStatusView {
  /** The hero's short status. */
  statusLabel: string;
  tone: DeliveryTone;
  title: string;
  body: string | null;
  /** Draft revisions left, shown while changes are requested. */
  revisionsLeft: string | null;
  /** The primary action's label; null = no action. */
  cta: string | null;
  canSubmit: boolean;
}

// What the Deliverables screen shows for each stage. Only the draft stages
// can submit here; the final round is 36b, so its stages are read-only.
// Nothing says "paid" - there is no escrow yet (backend item 19).
export function deliveryStatusView(delivery: EngagementDelivery): DeliveryStatusView | null {
  const base = { revisionsLeft: null, cta: null, canSubmit: false, body: null };
  switch (delivery.stage) {
    case 'awaiting_draft':
      return {
        ...base,
        statusLabel: 'To deliver',
        tone: 'neutral',
        title: 'Ready to deliver',
        body: 'Deliver every piece together as one draft.',
        cta: 'Submit delivery',
        canSubmit: true,
      };
    case 'draft_in_review':
      return {
        ...base,
        statusLabel: 'In review',
        tone: 'info',
        title: 'Draft submitted',
        body: "Waiting for the business's review.",
      };
    case 'draft_changes_requested':
      return {
        ...base,
        statusLabel: 'Changes requested',
        tone: 'warning',
        title: 'The business asked for changes',
        body: latestRound(delivery)?.reviewReason ?? null,
        revisionsLeft: formatRevisionsLeft(delivery.revisionsRemaining),
        cta: 'Submit revised draft',
        canSubmit: true,
      };
    case 'awaiting_final':
    case 'final_in_review':
    case 'final_changes_requested':
      return {
        ...base,
        statusLabel: 'Draft approved',
        tone: 'info',
        title: 'Draft approved',
        body: 'Final delivery is coming soon.',
      };
    case 'delivered':
      return {
        ...base,
        statusLabel: 'Completed',
        tone: 'success',
        title: 'Delivered',
        body: 'This campaign is complete.',
      };
    case 'escalated':
      return {
        ...base,
        statusLabel: 'In dispute',
        tone: 'error',
        title: 'In dispute',
        body: `${escalationCopy(delivery)} Disputes aren't available yet.`,
      };
    default:
      return null;
  }
}

export type SlotSource = 'keep' | 'link' | 'image';

// One piece's entry on the Submit delivery screen.
export interface DeliverySlot {
  pieceId: string;
  label: string;
  dueDate: string | null;
  /** The business's comment on this piece in the latest round. */
  comment: string | null;
  /** The piece's item in the latest round - what "Keep previous" reuses. */
  previous: {
    itemId: string;
    externalUrl: string | null;
    isUpload: boolean;
    caption: string | null;
  } | null;
  source: SlotSource;
  externalUrl: string;
  image: PickedImageAsset | null;
  caption: string;
}

// A slot per non-cancelled piece, in the backend's order. When the latest
// round holds an item for the piece, "Keep previous" is pre-selected so an
// unchanged piece is carried over (`reuseItemId`) with no re-upload.
export function initialSlots(delivery: EngagementDelivery): DeliverySlot[] {
  const items = new Map((latestRound(delivery)?.items ?? []).map(item => [item.pieceId, item]));
  return delivery.pieces
    .filter(piece => piece.status !== 'cancelled')
    .map(piece => {
      const item = items.get(piece.id);
      return {
        pieceId: piece.id,
        label: pieceTitle(piece),
        dueDate: piece.dueDate,
        comment: item?.reviewComment ?? null,
        previous: item
          ? {
              itemId: item.id,
              externalUrl: item.externalUrl,
              isUpload: !!item.mediaId,
              caption: item.caption,
            }
          : null,
        source: item ? 'keep' : 'link',
        externalUrl: '',
        image: null,
        caption: '',
      };
    });
}

// Field -> message for one slot. A kept piece only checks the caption; a
// link or image follows the same rules as before (validateSubmission).
export function validateSlot(slot: DeliverySlot): Partial<Record<SubmissionField, string>> {
  if (slot.source === 'keep') {
    if (!slot.previous) return { externalUrl: 'Paste the link to your content.' };
    return slot.caption.length > CAPTION_MAX_LENGTH
      ? { caption: `Keep the caption under ${CAPTION_MAX_LENGTH} characters.` }
      : {};
  }
  return validateSubmission({
    kind: slot.source,
    externalUrl: slot.externalUrl,
    image: slot.image,
    caption: slot.caption,
  });
}

export function isSlotReady(slot: DeliverySlot): boolean {
  return Object.keys(validateSlot(slot)).length === 0;
}

// The round body, one item per slot in slot order (so the backend's
// `items[i]` error keys map straight back to slot i). Exactly one content
// source each: a reused item never re-sends its old content - the server
// copies it, and its caption too when none is sent.
export function toRoundItems(
  slots: readonly DeliverySlot[],
  mediaIds: Readonly<Record<string, string>>,
): SubmitRoundItem[] {
  return slots.map(slot => {
    const caption = slot.caption.trim();
    const withCaption = caption ? { caption } : {};
    if (slot.source === 'keep' && slot.previous) {
      return { pieceId: slot.pieceId, reuseItemId: slot.previous.itemId, ...withCaption };
    }
    if (slot.source === 'image') {
      return { pieceId: slot.pieceId, mediaId: mediaIds[slot.pieceId], ...withCaption };
    }
    return { pieceId: slot.pieceId, externalUrl: slot.externalUrl.trim(), ...withCaption };
  });
}

// Backend 422 (`items[i]`, `items[i].pieceId|mediaId|reuseItemId|
// externalUrl|caption`) -> slot index -> message, first message per slot;
// `items` (missing pieces) is form-level.
export function roundErrorsFromApi(
  errors: Record<string, string> | null | undefined,
  slotCount: number,
): { slots: Record<number, string>; form: string | null } {
  const slots: Record<number, string> = {};
  let form: string | null = null;
  for (const [key, value] of Object.entries(errors ?? {})) {
    if (key === 'items') {
      form = value;
      continue;
    }
    const match = /^items\[(\d+)\](?:\.\w+)?$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    if (index < slotCount && !(index in slots)) slots[index] = value;
  }
  return { slots, form };
}
