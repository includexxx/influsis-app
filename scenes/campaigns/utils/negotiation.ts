import { EngagementOffer, EngagementStatus, MyEngagementDetail } from '../types/myEngagement';
import { MONTH_LABELS } from './mapCampaignFeedItem';

// Backend @MaxLength(2000) on the counter-offer note and on the decline /
// withdraw reason.
export const NEGOTIATION_TEXT_MAX_LENGTH = 2000;

// "28 Sep 2026" from an ISO timestamp, read in local time - offer dates and
// the escrow funding deadline. Empty for an unparseable value.
export function formatOfferDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

// Only these engagement statuses accept a counter, accept, decline, or
// withdraw.
const NEGOTIABLE_STATUSES: EngagementStatus[] = ['pending', 'countered'];

export interface OfferScreenState {
  /** The single live offer, if any (there may be none after a withdrawal). */
  pendingOffer: EngagementOffer | null;
  /** True when the pending offer was sent by the creator (the viewer). */
  pendingIsMine: boolean;
  roundsRemaining: number;
  isNegotiable: boolean;
  canAccept: boolean;
  canCounter: boolean;
  canWithdrawOffer: boolean;
  /** Invitations are declined (CF5)... */
  canDecline: boolean;
  /** ...the creator's own applications are withdrawn (CF6). */
  canWithdrawApplication: boolean;
  /** No rounds left and the business's offer is the one on the table. */
  isFinalOffer: boolean;
}

// Thread order: oldest round first. Returns a new array.
export function sortOffers(offers: readonly EngagementOffer[]): EngagementOffer[] {
  return [...offers].sort((a, b) => a.roundNo - b.roundNo);
}

// Which negotiation actions the creator may take right now. Mirrors the
// backend's rules (../backend 18d/18e/18k) so the buttons match what the
// server allows; the server still has the final word, and a 409 from it means
// this view was stale.
// - one pending offer at a time; you accept only the other side's;
// - a round is one offer, the opening one included; no counter at the cap;
// - turn rule: no countering your own pending offer (withdraw it instead);
// - everything only while the engagement is `pending` or `countered`.
export function getOfferScreenState(
  detail: Pick<
    MyEngagementDetail,
    'status' | 'origin' | 'offers' | 'negotiationRoundLimit' | 'negotiationRoundCount'
  >,
): OfferScreenState {
  const pendingOffer = detail.offers.find(offer => offer.status === 'pending') ?? null;
  const pendingIsMine = pendingOffer?.senderType === 'creator';
  const roundsRemaining = Math.max(0, detail.negotiationRoundLimit - detail.negotiationRoundCount);
  const isNegotiable = NEGOTIABLE_STATUSES.includes(detail.status);
  const theirOfferPending = pendingOffer !== null && !pendingIsMine;

  return {
    pendingOffer,
    pendingIsMine,
    roundsRemaining,
    isNegotiable,
    canAccept: isNegotiable && theirOfferPending,
    canCounter: isNegotiable && roundsRemaining > 0 && !pendingIsMine,
    canWithdrawOffer: isNegotiable && pendingIsMine,
    canDecline: isNegotiable && detail.origin === 'invited',
    canWithdrawApplication: isNegotiable && detail.origin === 'requested',
    isFinalOffer: isNegotiable && theirOfferPending && roundsRemaining === 0,
  };
}

export type ParseAmountResult = { ok: true; amountMinor: number } | { ok: false; error: string };

// Parses a counter-offer typed in whole BDT (thousands separators allowed,
// up to 2 decimals) into integer minor units.
export function parseCounterAmount(input: string): ParseAmountResult {
  const cleaned = input.replace(/[,\s]/g, '');

  if (cleaned === '') {
    return { ok: false, error: 'Enter an amount for your counter-offer.' };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: 'Enter the amount as a number, e.g. 25,000.' };
  }

  const amountMinor = Math.round(Number(cleaned) * 100);
  if (amountMinor <= 0) {
    return { ok: false, error: 'The amount must be more than 0.' };
  }

  return { ok: true, amountMinor };
}

// Optional note / reason; `null` when valid.
export function validateOptionalText(text: string): string | null {
  return text.length > NEGOTIATION_TEXT_MAX_LENGTH
    ? `Keep it under ${NEGOTIATION_TEXT_MAX_LENGTH} characters.`
    : null;
}
