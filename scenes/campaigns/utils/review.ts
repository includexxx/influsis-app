import { z } from 'zod';
import { ApiError } from '@/services/http';
import { EngagementReview, EngagementReviewState } from '../types/review';
import { formatOfferDate } from './negotiation';

export const REVIEW_MESSAGE_MIN_LENGTH = 10;
export const REVIEW_MESSAGE_MAX_LENGTH = 2000;

const GENERIC = 'Something went wrong. Please try again.';

// CK2's body rules, checked before sending: a rating 0-5 in half steps (0 is
// a real rating; `null` means none picked yet) and a message of 10-2000
// characters once trimmed.
export const reviewSchema = z.object({
  rating: z
    .number()
    .nullable()
    .refine(value => value !== null && value >= 0 && value <= 5 && Number.isInteger(value * 2), {
      message: 'Choose a rating',
    }),
  message: z
    .string()
    .trim()
    .min(REVIEW_MESSAGE_MIN_LENGTH, `Write at least ${REVIEW_MESSAGE_MIN_LENGTH} characters`)
    .max(REVIEW_MESSAGE_MAX_LENGTH, `Keep it under ${REVIEW_MESSAGE_MAX_LENGTH} characters`),
});

export type ReviewValues = z.infer<typeof reviewSchema>;

export const reviewDefaultValues: ReviewValues = { rating: null, message: '' };

// Validated form values -> CK2's body.
export function toReviewPayload(values: ReviewValues): { rating: number; message: string } {
  return { rating: values.rating ?? 0, message: values.message.trim() };
}

type SetError = (name: keyof ReviewValues | 'root', error: { message: string }) => void;

// Maps a failed CK2 that isn't a 409 (the screen refetches CK1 for those)
// onto the form: `errors.rating`/`errors.message` on their fields, anything
// else as one form-level message.
export function applyReviewError(err: unknown, setError: SetError): void {
  if (!(err instanceof ApiError)) {
    setError('root', { message: GENERIC });
    return;
  }
  if (err.errors) {
    let matched = false;
    for (const [key, message] of Object.entries(err.errors)) {
      if (key === 'rating' || key === 'message') {
        setError(key, { message });
        matched = true;
      }
    }
    if (matched) return;
  }
  if (err.code === 'NETWORK_ERROR') {
    setError('root', { message: 'Cannot reach the server. Check your connection and try again.' });
    return;
  }
  setError('root', { message: err.message || GENERIC });
}

export type ReviewCardState =
  /** Not completed yet - there is nothing to show. */
  | { kind: 'none' }
  /** The creator can write theirs. `theirs` is set once it's visible anyway
   * (7 days after completion) even though the creator hasn't reviewed. */
  | { kind: 'write'; theyReviewed: boolean; theirs: EngagementReview | null }
  /** Theirs is written; the business's is not visible (yet). */
  | { kind: 'submitted-blind'; mine: EngagementReview }
  /** Both reviews are visible. */
  | { kind: 'revealed'; mine: EngagementReview; theirs: EngagementReview };

// Which review view CK1 calls for. `theirs: null` with `theirsSubmitted`
// means "written, still blind" - never "no review".
export function reviewCardState(state: EngagementReviewState): ReviewCardState {
  if (state.engagementStatus !== 'completed') return { kind: 'none' };
  if (state.mine) {
    return state.theirs
      ? { kind: 'revealed', mine: state.mine, theirs: state.theirs }
      : { kind: 'submitted-blind', mine: state.mine };
  }
  if (state.canReview) {
    return { kind: 'write', theyReviewed: state.theirsSubmitted, theirs: state.theirs };
  }
  return { kind: 'none' };
}

// The business's name for copy, or "the business" when it isn't known (CB2
// 404s once the campaign isn't live).
export function businessLabel(name: string | null | undefined): string {
  return name?.trim() || 'the business';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Where the creator's own review stands under the blind reveal.
export function reviewVisibilityLine(
  mine: EngagementReview,
  revealAt: string | null,
  business: string | null | undefined,
): string {
  const name = businessLabel(business);
  if (mine.isVisible) return `Visible to ${name}`;
  const date = formatOfferDate(revealAt ?? mine.visibleAt);
  return `${capitalize(name)} can see it on ${date}, or sooner if they review you`;
}
