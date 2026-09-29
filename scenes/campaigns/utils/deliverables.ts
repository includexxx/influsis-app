import { palette } from '@/theme';
import { PickedImageAsset } from '@/utils/onboardingSchemas';

import { DeliverablePiece, DeliverablePieceStatus } from '../types/deliverables';
import { scopeItemLabel } from './scope';

// Delivering an engagement's pieces (backend CI1/CI2/CI4). Mirrors the
// backend's deliverable rules (deliverable-rules.ts) so the app only offers
// what the server would accept; the server still has the final word.

export const URL_MAX_LENGTH = 2048;
export const CAPTION_MAX_LENGTH = 2000;

export const PIECE_STATUS_BADGE: Record<
  DeliverablePieceStatus,
  { label: string; color: string; text: string }
> = {
  pending: { label: 'To deliver', color: palette.gray[25], text: palette.gray[700] },
  in_progress: { label: 'In progress', color: palette.gray[25], text: palette.gray[700] },
  submitted: { label: 'Awaiting review', color: palette.warning[50], text: palette.warning[700] },
  changes_requested: {
    label: 'Changes requested',
    color: palette.warning[50],
    text: palette.warning[700],
  },
  approved: { label: 'Approved', color: palette.success[50], text: palette.success[700] },
  escalated: { label: 'In dispute', color: palette.error[50], text: palette.error[700] },
  cancelled: { label: 'Cancelled', color: palette.gray[25], text: palette.gray[700] },
};

// Backend canSubmitToDeliverable: a finished, escalated or cancelled piece
// takes no more submissions. A piece already awaiting review can take a newer
// revision - approving one supersedes the others.
export function canSubmitPiece(status: DeliverablePieceStatus): boolean {
  return status !== 'approved' && status !== 'escalated' && status !== 'cancelled';
}

// The business's newest change request on this piece, or null.
export function latestChangeRequest(piece: Pick<DeliverablePiece, 'submissions'>): string | null {
  const requested = piece.submissions
    .filter(submission => submission.reviewDecision === 'changes_requested')
    .sort((a, b) => b.revisionNo - a.revisionNo);
  return requested[0]?.reviewReason ?? null;
}

// `dueDate` is a date-only `YYYY-MM-DD`; overdue once today's date is past it
// (the backend's isLateSubmission rule). `now` is a parameter for tests.
export function isOverdue(dueDate: string | null, now: Date): boolean {
  if (!dueDate) return false;
  return now.toISOString().slice(0, 10) > dueDate;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export type SubmissionField = 'externalUrl' | 'image' | 'caption';

export function validateSubmission(input: {
  kind: 'link' | 'image';
  externalUrl: string;
  image: PickedImageAsset | null;
  caption: string;
}): Partial<Record<SubmissionField, string>> {
  const errors: Partial<Record<SubmissionField, string>> = {};
  if (input.kind === 'link') {
    const url = input.externalUrl.trim();
    if (!url) errors.externalUrl = 'Paste the link to your content.';
    else if (!isHttpUrl(url)) errors.externalUrl = 'Enter a full link starting with https://';
    else if (url.length > URL_MAX_LENGTH) {
      errors.externalUrl = `Keep the link under ${URL_MAX_LENGTH} characters.`;
    }
  } else if (!input.image) {
    errors.image = 'Choose an image to upload.';
  }
  if (input.caption.length > CAPTION_MAX_LENGTH) {
    errors.caption = `Keep the caption under ${CAPTION_MAX_LENGTH} characters.`;
  }
  return errors;
}

// `null` when valid.
export function validateLivePostUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return 'Paste the link to the live post.';
  if (!isHttpUrl(url)) return 'Enter a full link starting with https://';
  if (url.length > URL_MAX_LENGTH) return `Keep the link under ${URL_MAX_LENGTH} characters.`;
  return null;
}

// Only http(s) links may be opened; anything else stays plain text.
export function safeHttpUrl(value: string | null | undefined): string | null {
  return value && isHttpUrl(value) ? value : null;
}

// "Instagram Reels · 2".
export function pieceTitle(piece: Pick<DeliverablePiece, 'platform' | 'type' | 'pieceNo'>): string {
  return `${scopeItemLabel(piece)} · ${piece.pieceNo}`;
}
