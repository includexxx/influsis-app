import { describe, expect, test } from '@jest/globals';

import { DeliverablePieceStatus, DeliverableSubmission } from '../types/deliverables';
import {
  canSubmitPiece,
  isOverdue,
  latestChangeRequest,
  pieceTitle,
  safeHttpUrl,
  validateLivePostUrl,
  validateSubmission,
} from './deliverables';

function submission(
  revisionNo: number,
  reviewDecision: DeliverableSubmission['reviewDecision'],
  reviewReason: string | null = null,
): DeliverableSubmission {
  return {
    id: `s${revisionNo}`,
    revisionNo,
    submittedByUserId: 'creator-1',
    submittedAt: '2026-09-28T10:00:00.000Z',
    isLate: false,
    mediaId: null,
    externalUrl: 'https://example.com/v',
    caption: null,
    livePostUrl: null,
    postedAt: null,
    status: reviewDecision ?? 'submitted',
    reviewDecision,
    reviewReason,
    reviewedAt: null,
    reviewedByUserId: null,
    reviewDueAt: '2026-10-05T10:00:00.000Z',
  };
}

describe('canSubmitPiece', () => {
  test('allows the backend-submittable statuses', () => {
    const allowed: DeliverablePieceStatus[] = [
      'pending',
      'in_progress',
      'submitted',
      'changes_requested',
    ];
    for (const status of allowed) expect(canSubmitPiece(status)).toBe(true);
  });

  test('refuses approved, escalated and cancelled pieces', () => {
    for (const status of ['approved', 'escalated', 'cancelled'] as const) {
      expect(canSubmitPiece(status)).toBe(false);
    }
  });
});

describe('latestChangeRequest', () => {
  test('is null without a change request', () => {
    expect(latestChangeRequest({ submissions: [] })).toBeNull();
    expect(latestChangeRequest({ submissions: [submission(1, 'approved')] })).toBeNull();
  });

  test('returns the newest change request reason', () => {
    expect(
      latestChangeRequest({
        submissions: [
          submission(1, 'changes_requested', 'Hook is too slow.'),
          submission(2, 'changes_requested', 'Add the promo code.'),
          submission(3, null),
        ],
      }),
    ).toBe('Add the promo code.');
  });
});

describe('isOverdue', () => {
  test('is overdue only after the due date', () => {
    expect(isOverdue('2026-10-05', new Date('2026-10-05T12:00:00.000Z'))).toBe(false);
    expect(isOverdue('2026-10-05', new Date('2026-10-06T00:00:00.000Z'))).toBe(true);
    expect(isOverdue(null, new Date())).toBe(false);
  });
});

describe('validateSubmission', () => {
  const base = { kind: 'link' as const, externalUrl: '', image: null, caption: '' };

  test('requires a full http(s) link in link mode', () => {
    expect(validateSubmission(base).externalUrl).toBe('Paste the link to your content.');
    expect(validateSubmission({ ...base, externalUrl: 'instagram.com/p/1' }).externalUrl).toBe(
      'Enter a full link starting with https://',
    );
    expect(validateSubmission({ ...base, externalUrl: 'javascript:alert(1)' }).externalUrl).toBe(
      'Enter a full link starting with https://',
    );
    expect(validateSubmission({ ...base, externalUrl: 'https://instagram.com/p/1' })).toEqual({});
  });

  test('requires an image in image mode', () => {
    expect(validateSubmission({ ...base, kind: 'image' }).image).toBe('Choose an image to upload.');
    expect(validateSubmission({ ...base, kind: 'image', image: { uri: 'file:///x.jpg' } })).toEqual(
      {},
    );
  });

  test('caps the caption at 2000 characters', () => {
    expect(
      validateSubmission({
        ...base,
        externalUrl: 'https://x.com/a',
        caption: 'x'.repeat(2001),
      }).caption,
    ).toBeDefined();
  });
});

describe('validateLivePostUrl', () => {
  test('requires a full http(s) link', () => {
    expect(validateLivePostUrl('')).not.toBeNull();
    expect(validateLivePostUrl('tiktok.com/@me')).not.toBeNull();
    expect(validateLivePostUrl('https://tiktok.com/@me/video/1')).toBeNull();
  });
});

describe('safeHttpUrl', () => {
  test('keeps only http(s) links', () => {
    expect(safeHttpUrl('https://a.com')).toBe('https://a.com');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});

describe('pieceTitle', () => {
  test('combines the deliverable label and the piece number', () => {
    expect(pieceTitle({ platform: 'instagram', type: 'reels', pieceNo: 2 })).toBe(
      'Instagram Reels · 2',
    );
  });
});
