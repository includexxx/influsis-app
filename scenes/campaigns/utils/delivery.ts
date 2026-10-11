import { PickedImageAsset } from '@/utils/onboardingSchemas';

import {
  DeliveryFinalKind,
  DeliveryPhase,
  DeliveryRound,
  DeliveryStage,
  EngagementDelivery,
  SubmitRoundItem,
} from '../types/delivery';
import {
  CAPTION_MAX_LENGTH,
  formatRevisionsLeft,
  pieceTitle,
  SubmissionField,
  validateSubmission,
} from './deliverables';
import { PLATFORM_LABELS } from './mapCampaignDetails';

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

// Which round the creator can send now: the phase follows the stage
// (backend nextRoundPhase), and only these four stages accept a round.
export function submitPhase(stage: DeliveryStage | null): DeliveryPhase | null {
  if (stage === 'awaiting_draft' || stage === 'draft_changes_requested') return 'draft';
  if (stage === 'awaiting_final' || stage === 'final_changes_requested') return 'final';
  return null;
}

// Hosts a live post may be on, per platform; subdomains included. Mirrors
// backend LIVE_POST_DOMAINS (delivery-round-rules.ts).
export const LIVE_POST_DOMAINS: Readonly<Record<string, readonly string[]>> = {
  facebook: ['facebook.com', 'fb.com', 'fb.watch'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
};

// The lowercase hostname of an http(s) URL, or null. Parsed from the
// authority by hand rather than with URL: React Native's URL getters are
// regexes whose userinfo match can run into the path
// ("https://evil.test/@instagram.com"), and this keeps Jest and devices alike.
function httpHostname(url: string): string | null {
  const match = /^https?:\/\/([^/?#\s]*)/i.exec(url.trim());
  if (!match) return null;
  const authority = match[1];
  const host = authority.slice(authority.lastIndexOf('@') + 1).replace(/:\d*$/, '');
  return host ? host.toLowerCase() : null;
}

// Backend isLivePostHostFor: the hostname equals an allowed domain or ends
// with "." + it, so "www.instagram.com" passes and "evilinstagram.com" doesn't.
// A platform with no listed domains (a custom piece) takes any http(s) URL.
export function isLivePostHostFor(platform: string, url: string): boolean {
  const host = httpHostname(url);
  if (!host) return false;
  const domains = LIVE_POST_DOMAINS[platform];
  if (!domains) return true;
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
}

export type DeliveryTone = 'neutral' | 'info' | 'warning' | 'success' | 'error';

export interface DeliveryStatusView {
  /** The hero's short status. */
  statusLabel: string;
  tone: DeliveryTone;
  title: string;
  body: string | null;
  /** Revisions left in the current phase, shown while changes are requested. */
  revisionsLeft: string | null;
  /** The primary action's label; null = no action. */
  cta: string | null;
  canSubmit: boolean;
  /** A round awaits the business's review - show when it was submitted. */
  inReview: boolean;
}

// What the Deliverables screen shows for each stage: draft rounds, then the
// final round (backend 18r1/18r2). Nothing says "paid" - there is no escrow
// yet (backend item 19).
export function deliveryStatusView(delivery: EngagementDelivery): DeliveryStatusView | null {
  const base = {
    revisionsLeft: null,
    cta: null,
    canSubmit: submitPhase(delivery.stage) !== null,
    inReview: delivery.stage === 'draft_in_review' || delivery.stage === 'final_in_review',
    body: null,
  };
  switch (delivery.stage) {
    case 'awaiting_draft':
      return {
        ...base,
        statusLabel: 'To deliver',
        tone: 'neutral',
        title: 'Ready to deliver',
        body: 'Deliver every piece together as one draft.',
        cta: 'Submit delivery',
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
      };
    case 'awaiting_final':
      return {
        ...base,
        statusLabel: 'Final due',
        tone: 'neutral',
        title: 'Draft approved',
        body: 'Now send the final delivery for every piece.',
        cta: 'Send final delivery',
      };
    case 'final_in_review':
      return {
        ...base,
        statusLabel: 'In review',
        tone: 'info',
        title: 'Final delivery submitted',
        body: "Waiting for the business's review.",
      };
    case 'final_changes_requested':
      return {
        ...base,
        statusLabel: 'Changes requested',
        tone: 'warning',
        title: 'The business asked for changes to the final delivery',
        body: latestRound(delivery)?.reviewReason ?? null,
        revisionsLeft: formatRevisionsLeft(delivery.finalRevisionsRemaining),
        cta: 'Resend final delivery',
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
  /** The round being sent - a final item is always a link. */
  phase: DeliveryPhase;
  platform: string;
  /** What the piece's final item must be (server-computed). */
  finalKind: DeliveryFinalKind;
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
// unchanged piece is carried over (`reuseItemId`) with no re-upload. In the
// final phase that's only when the kept item would pass the final rules (a
// link - for a live post, on the piece's platform); otherwise Link.
export function initialSlots(delivery: EngagementDelivery): DeliverySlot[] {
  const phase = submitPhase(delivery.stage) ?? 'draft';
  const items = new Map((latestRound(delivery)?.items ?? []).map(item => [item.pieceId, item]));
  return delivery.pieces
    .filter(piece => piece.status !== 'cancelled')
    .map(piece => {
      const item = items.get(piece.id);
      const slot: DeliverySlot = {
        pieceId: piece.id,
        label: pieceTitle(piece),
        phase,
        platform: piece.platform,
        finalKind: piece.finalKind,
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
      if (slot.source === 'keep' && !isSlotReady(slot)) slot.source = 'link';
      return slot;
    });
}

// The sources a slot offers: a draft takes a kept item, a link or an image;
// a final takes only a link, or a kept item that was a link.
export function slotSources(slot: DeliverySlot): SlotSource[] {
  if (slot.phase === 'final') {
    return slot.previous && !slot.previous.isUpload ? ['keep', 'link'] : ['link'];
  }
  return slot.previous ? ['keep', 'link', 'image'] : ['link', 'image'];
}

// The link field's label and the slot's hint, by phase and final kind.
export function slotCopy(slot: DeliverySlot): { linkLabel: string; hint: string | null } {
  if (slot.phase === 'draft') return { linkLabel: 'Link to your content', hint: null };
  if (slot.finalKind === 'file_link') {
    return {
      linkLabel: 'Link to your files',
      hint: 'Share the final files, e.g. a Google Drive or Dropbox link.',
    };
  }
  const platform = LIVE_POST_DOMAINS[slot.platform] ? PLATFORM_LABELS[slot.platform] : null;
  return {
    linkLabel: 'Live post URL',
    hint: platform
      ? `Post it on ${platform}, then paste the live post link.`
      : 'Post it, then paste the link to the live post.',
  };
}

// A live post on the wrong host, or null (backend finalItemErrors).
function livePostError(slot: DeliverySlot, url: string): string | null {
  if (slot.phase !== 'final' || slot.finalKind !== 'live_post') return null;
  if (isLivePostHostFor(slot.platform, url)) return null;
  const platform = PLATFORM_LABELS[slot.platform] ?? slot.platform;
  return `Paste the ${platform} post link.`;
}

// Field -> message for one slot. A kept piece checks its caption (and, in a
// final, that it's a link on the right host); a link or image follows the
// shared rules (validateSubmission). A final item is never an upload
// (backend finalItemErrors), and the server re-checks all of it.
export function validateSlot(slot: DeliverySlot): Partial<Record<SubmissionField, string>> {
  const captionError =
    slot.caption.length > CAPTION_MAX_LENGTH
      ? { caption: `Keep the caption under ${CAPTION_MAX_LENGTH} characters.` }
      : {};
  if (slot.source === 'keep') {
    if (!slot.previous) return { externalUrl: 'Paste the link to your content.' };
    if (slot.phase === 'final') {
      if (slot.previous.isUpload || !slot.previous.externalUrl) {
        return { externalUrl: 'That was an uploaded file. Paste a link instead.' };
      }
      const hostError = livePostError(slot, slot.previous.externalUrl);
      if (hostError) return { externalUrl: hostError };
    }
    return captionError;
  }
  if (slot.phase === 'final' && slot.source === 'image') {
    return { image: 'A final delivery takes a link, not an upload.' };
  }
  const errors = validateSubmission({
    kind: slot.source,
    externalUrl: slot.externalUrl,
    image: slot.image,
    caption: slot.caption,
  });
  if (slot.source === 'link' && !errors.externalUrl) {
    const hostError = livePostError(slot, slot.externalUrl);
    if (hostError) errors.externalUrl = hostError;
  }
  return errors;
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
