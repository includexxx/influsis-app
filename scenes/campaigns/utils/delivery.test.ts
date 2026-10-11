import { describe, expect, test } from '@jest/globals';

import {
  DeliveryPiece,
  DeliveryRound,
  DeliveryRoundItem,
  EngagementDelivery,
} from '../types/delivery';
import {
  deliveryStatusView,
  DeliverySlot,
  escalationCopy,
  initialSlots,
  isSlotReady,
  latestRound,
  roundErrorsFromApi,
  toRoundItems,
  validateSlot,
} from './delivery';

function piece(overrides: Partial<DeliveryPiece> = {}): DeliveryPiece {
  return {
    id: 'p1',
    scopeItemId: 's1',
    platform: 'instagram',
    type: 'reels',
    title: null,
    pieceNo: 1,
    dueDate: '2026-10-20',
    status: 'pending',
    finalKind: 'file_link',
    ...overrides,
  };
}

function item(overrides: Partial<DeliveryRoundItem> = {}): DeliveryRoundItem {
  return {
    id: 'i1',
    pieceId: 'p1',
    revisionNo: 1,
    mediaId: null,
    externalUrl: 'https://drive.test/a',
    livePostUrl: null,
    caption: null,
    reviewComment: null,
    status: 'changes_requested',
    reusedFromSubmissionId: null,
    ...overrides,
  };
}

function round(overrides: Partial<DeliveryRound> = {}): DeliveryRound {
  return {
    id: 'r1',
    phase: 'draft',
    roundNo: 1,
    status: 'changes_requested',
    converted: false,
    submittedAt: '2026-10-08T10:00:00.000Z',
    isLate: false,
    reviewDueAt: '2026-10-15T10:00:00.000Z',
    reviewDecision: 'changes_requested',
    reviewReason: 'Logo must show in the first 3 seconds',
    reviewedAt: '2026-10-09T10:00:00.000Z',
    reviewedByUserId: 'biz-user',
    items: [item()],
    ...overrides,
  };
}

function delivery(overrides: Partial<EngagementDelivery> = {}): EngagementDelivery {
  return {
    stage: 'awaiting_draft',
    objective: 'ugc_content',
    revisionsRemaining: 2,
    draftChangeRequests: 0,
    finalRevisionsRemaining: 1,
    finalChangeRequests: 0,
    escalatedAt: null,
    escalationReason: null,
    pieces: [piece()],
    rounds: [],
    ...overrides,
  };
}

function slot(overrides: Partial<DeliverySlot> = {}): DeliverySlot {
  return {
    pieceId: 'p1',
    label: 'Instagram Reels · 1',
    dueDate: null,
    comment: null,
    previous: null,
    source: 'link',
    externalUrl: '',
    image: null,
    caption: '',
    ...overrides,
  };
}

describe('latestRound', () => {
  test('prefers the newest final round, else the newest draft', () => {
    const d1 = round({ id: 'd1', roundNo: 1 });
    const d2 = round({ id: 'd2', roundNo: 2, status: 'approved' });
    const f1 = round({ id: 'f1', phase: 'final', roundNo: 1, status: 'submitted' });
    expect(latestRound({ rounds: [] })).toBeNull();
    expect(latestRound({ rounds: [d1, d2] })?.id).toBe('d2');
    expect(latestRound({ rounds: [d1, d2, f1] })?.id).toBe('f1');
  });
});

describe('escalationCopy', () => {
  test('names the final or draft limit, else a generic line', () => {
    expect(escalationCopy({ draftChangeRequests: 1, finalChangeRequests: 2 })).toBe(
      'The business requested changes to the final delivery twice.',
    );
    expect(escalationCopy({ draftChangeRequests: 3, finalChangeRequests: 0 })).toBe(
      'The business requested changes to the draft 3 times.',
    );
    expect(escalationCopy({ draftChangeRequests: 0, finalChangeRequests: 0 })).toBe(
      'This delivery was escalated to a dispute.',
    );
  });
});

describe('deliveryStatusView', () => {
  test('awaiting a draft offers Submit delivery', () => {
    expect(deliveryStatusView(delivery())).toMatchObject({
      tone: 'neutral',
      body: 'Deliver every piece together as one draft.',
      cta: 'Submit delivery',
      canSubmit: true,
    });
  });

  test('a draft in review has no action', () => {
    expect(
      deliveryStatusView(
        delivery({ stage: 'draft_in_review', rounds: [round({ status: 'submitted' })] }),
      ),
    ).toMatchObject({ title: 'Draft submitted', cta: null, canSubmit: false });
  });

  test("changes requested shows the round's reason, revisions left and a resubmit", () => {
    expect(
      deliveryStatusView(
        delivery({
          stage: 'draft_changes_requested',
          revisionsRemaining: 1,
          draftChangeRequests: 1,
          rounds: [round()],
        }),
      ),
    ).toMatchObject({
      tone: 'warning',
      title: 'The business asked for changes',
      body: 'Logo must show in the first 3 seconds',
      revisionsLeft: '1 revision left',
      cta: 'Submit revised draft',
      canSubmit: true,
    });
  });

  test('final stages are read-only until 36b', () => {
    for (const stage of ['awaiting_final', 'final_in_review', 'final_changes_requested'] as const) {
      expect(deliveryStatusView(delivery({ stage }))).toMatchObject({
        title: 'Draft approved',
        body: 'Final delivery is coming soon.',
        cta: null,
        canSubmit: false,
      });
    }
  });

  test('delivered never mentions payment', () => {
    const view = deliveryStatusView(delivery({ stage: 'delivered' }));
    expect(view).toMatchObject({ tone: 'success', title: 'Delivered', canSubmit: false });
    expect(JSON.stringify(view)).not.toMatch(/paid|payment/i);
  });

  test('escalated shows the dispute copy and no action', () => {
    expect(
      deliveryStatusView(delivery({ stage: 'escalated', draftChangeRequests: 3 })),
    ).toMatchObject({
      tone: 'error',
      title: 'In dispute',
      body: "The business requested changes to the draft 3 times. Disputes aren't available yet.",
      cta: null,
    });
  });

  test('is null outside delivery', () => {
    expect(deliveryStatusView(delivery({ stage: null }))).toBeNull();
  });
});

describe('initialSlots', () => {
  test('a slot per non-cancelled piece, Link by default with no earlier round', () => {
    const slots = initialSlots(
      delivery({
        pieces: [
          piece(),
          piece({ id: 'p2', status: 'cancelled' }),
          piece({ id: 'p3', pieceNo: 2 }),
        ],
      }),
    );
    expect(slots.map(s => s.pieceId)).toEqual(['p1', 'p3']);
    expect(slots[0]).toMatchObject({
      source: 'link',
      previous: null,
      label: 'Instagram Reels · 1',
    });
  });

  test("pre-selects Keep previous with the latest round's item and comment", () => {
    const slots = initialSlots(
      delivery({
        stage: 'draft_changes_requested',
        pieces: [piece(), piece({ id: 'p2', pieceNo: 2 })],
        rounds: [
          round({
            items: [
              item({ reviewComment: 'Re-shoot in daylight', caption: 'v1' }),
              item({ id: 'i2', pieceId: 'p2', externalUrl: null, mediaId: 'm1' }),
            ],
          }),
        ],
      }),
    );
    expect(slots[0]).toMatchObject({
      source: 'keep',
      comment: 'Re-shoot in daylight',
      previous: {
        itemId: 'i1',
        externalUrl: 'https://drive.test/a',
        isUpload: false,
        caption: 'v1',
      },
    });
    expect(slots[1].previous).toMatchObject({ itemId: 'i2', isUpload: true });
  });
});

describe('validateSlot / isSlotReady', () => {
  test('a link must be a full http(s) URL', () => {
    expect(validateSlot(slot())).toEqual({ externalUrl: 'Paste the link to your content.' });
    expect(validateSlot(slot({ externalUrl: 'drive.test/a' }))).toEqual({
      externalUrl: 'Enter a full link starting with https://',
    });
    expect(isSlotReady(slot({ externalUrl: 'https://drive.test/a' }))).toBe(true);
  });

  test('an image must be picked', () => {
    expect(validateSlot(slot({ source: 'image' }))).toEqual({
      image: 'Choose an image to upload.',
    });
    expect(isSlotReady(slot({ source: 'image', image: { uri: 'file:///a.jpg' } }))).toBe(true);
  });

  test('a kept piece only checks its caption', () => {
    const previous = { itemId: 'i1', externalUrl: null, isUpload: true, caption: null };
    expect(isSlotReady(slot({ source: 'keep', previous }))).toBe(true);
    expect(validateSlot(slot({ source: 'keep', previous, caption: 'x'.repeat(2001) }))).toEqual({
      caption: 'Keep the caption under 2000 characters.',
    });
    expect(isSlotReady(slot({ source: 'keep' }))).toBe(false);
  });
});

describe('toRoundItems', () => {
  test('one source per item, in slot order, caption trimmed and only when set', () => {
    const previous = { itemId: 'i9', externalUrl: null, isUpload: true, caption: 'old' };
    expect(
      toRoundItems(
        [
          slot({ pieceId: 'p1', externalUrl: ' https://drive.test/v2 ', caption: '  New cut ' }),
          slot({ pieceId: 'p2', source: 'image', image: { uri: 'file:///a.jpg' } }),
          slot({ pieceId: 'p3', source: 'keep', previous, caption: '   ' }),
          slot({ pieceId: 'p4', source: 'keep', previous, caption: 'Fresh caption' }),
        ],
        { p2: 'media-2' },
      ),
    ).toEqual([
      { pieceId: 'p1', externalUrl: 'https://drive.test/v2', caption: 'New cut' },
      { pieceId: 'p2', mediaId: 'media-2' },
      { pieceId: 'p3', reuseItemId: 'i9' },
      { pieceId: 'p4', reuseItemId: 'i9', caption: 'Fresh caption' },
    ]);
  });
});

describe('roundErrorsFromApi', () => {
  test('maps item keys to slots (first wins) and `items` to the form', () => {
    expect(
      roundErrorsFromApi(
        {
          'items[1].externalUrl': 'must be a URL',
          'items[1]': 'send exactly one of mediaId, externalUrl or reuseItemId',
          'items[0].mediaId': 'unknown media',
          'items[7].caption': 'out of range',
          items: 'every deliverable must be included - missing: p3',
          other: 'ignored',
        },
        2,
      ),
    ).toEqual({
      slots: { 0: 'unknown media', 1: 'must be a URL' },
      form: 'every deliverable must be included - missing: p3',
    });
    expect(roundErrorsFromApi(null, 1)).toEqual({ slots: {}, form: null });
  });
});
