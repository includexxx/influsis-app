import { describe, expect, test } from '@jest/globals';

import { EngagementOffer, EngagementOrigin, EngagementStatus } from '../types/myEngagement';
import {
  formatOfferDate,
  getOfferScreenState,
  parseCounterAmount,
  sortOffers,
  validateOptionalText,
} from './negotiation';

function offer(
  roundNo: number,
  senderType: EngagementOffer['senderType'],
  status: EngagementOffer['status'],
): EngagementOffer {
  return {
    id: `o${roundNo}`,
    roundNo,
    senderType,
    amountMinor: roundNo * 100_000,
    currency: 'BDT',
    note: null,
    status,
    createdAt: '2026-09-28T10:00:00.000Z',
  };
}

function detail(
  status: EngagementStatus,
  origin: EngagementOrigin,
  offers: EngagementOffer[],
  negotiationRoundLimit = 3,
) {
  return { status, origin, offers, negotiationRoundLimit, negotiationRoundCount: offers.length };
}

describe('getOfferScreenState', () => {
  test('fresh invitation: accept, counter or decline - no withdraw', () => {
    const state = getOfferScreenState(
      detail('pending', 'invited', [offer(1, 'business', 'pending')]),
    );

    expect(state).toMatchObject({
      pendingIsMine: false,
      roundsRemaining: 2,
      canAccept: true,
      canCounter: true,
      canWithdrawOffer: false,
      canDecline: true,
      canWithdrawApplication: false,
      isFinalOffer: false,
    });
  });

  test('own fresh application: waiting - withdraw the offer or the application', () => {
    const state = getOfferScreenState(
      detail('pending', 'requested', [offer(1, 'creator', 'pending')]),
    );

    expect(state).toMatchObject({
      pendingIsMine: true,
      canAccept: false,
      canCounter: false,
      canWithdrawOffer: true,
      canDecline: false,
      canWithdrawApplication: true,
    });
  });

  test("the business countered the creator's application", () => {
    const state = getOfferScreenState(
      detail('countered', 'requested', [
        offer(1, 'creator', 'superseded'),
        offer(2, 'business', 'pending'),
      ]),
    );

    expect(state.pendingOffer?.id).toBe('o2');
    expect(state).toMatchObject({ canAccept: true, canCounter: true, roundsRemaining: 1 });
  });

  test("rounds exhausted with the business's offer pending: final offer", () => {
    const state = getOfferScreenState(
      detail('countered', 'invited', [
        offer(1, 'business', 'superseded'),
        offer(2, 'creator', 'superseded'),
        offer(3, 'business', 'pending'),
      ]),
    );

    expect(state).toMatchObject({
      roundsRemaining: 0,
      canAccept: true,
      canCounter: false,
      isFinalOffer: true,
    });
  });

  test('no pending offer after a withdrawal: counter allowed while rounds remain', () => {
    const state = getOfferScreenState(
      detail('pending', 'requested', [offer(1, 'creator', 'withdrawn')]),
    );

    expect(state).toMatchObject({
      pendingOffer: null,
      canAccept: false,
      canCounter: true,
      canWithdrawOffer: false,
      canWithdrawApplication: true,
    });
  });

  test('never reports negative rounds', () => {
    const state = getOfferScreenState({
      status: 'countered',
      origin: 'invited',
      offers: [offer(1, 'business', 'pending')],
      negotiationRoundLimit: 1,
      negotiationRoundCount: 3,
    });

    expect(state.roundsRemaining).toBe(0);
  });

  test.each<EngagementStatus>([
    'accepted',
    'declined',
    'withdrawn',
    'expired',
    'completed',
    'cancelled',
  ])('closed status %s: nothing is negotiable', status => {
    const state = getOfferScreenState(
      detail(status, 'invited', [offer(1, 'business', 'accepted')]),
    );

    expect(state).toMatchObject({
      isNegotiable: false,
      canAccept: false,
      canCounter: false,
      canWithdrawOffer: false,
      canDecline: false,
      canWithdrawApplication: false,
      isFinalOffer: false,
    });
  });
});

describe('sortOffers', () => {
  test('orders by round without mutating the input', () => {
    const input = [offer(3, 'business', 'pending'), offer(1, 'creator', 'superseded')];

    expect(sortOffers(input).map(o => o.roundNo)).toEqual([1, 3]);
    expect(input[0].roundNo).toBe(3);
  });
});

describe('parseCounterAmount', () => {
  test('converts whole BDT with separators to minor units', () => {
    expect(parseCounterAmount('25,000')).toEqual({ ok: true, amountMinor: 2_500_000 });
    expect(parseCounterAmount(' 1500 ')).toEqual({ ok: true, amountMinor: 150_000 });
    expect(parseCounterAmount('99.5')).toEqual({ ok: true, amountMinor: 9_950 });
  });

  test.each(['', '   ', 'abc', '12abc', '-500', '1.234', '1e5'])('rejects %p', input => {
    expect(parseCounterAmount(input).ok).toBe(false);
  });

  test('rejects zero', () => {
    expect(parseCounterAmount('0')).toEqual({
      ok: false,
      error: 'The amount must be more than 0.',
    });
  });
});

describe('validateOptionalText', () => {
  test('allows empty text and rejects more than 2000 characters', () => {
    expect(validateOptionalText('')).toBeNull();
    expect(validateOptionalText('x'.repeat(2000))).toBeNull();
    expect(validateOptionalText('x'.repeat(2001))).not.toBeNull();
  });
});

describe('formatOfferDate', () => {
  test('formats an ISO timestamp as day, month and year', () => {
    expect(formatOfferDate('2026-09-28T10:00:00')).toBe('28 Sep 2026');
  });

  test('returns an empty string for an invalid value', () => {
    expect(formatOfferDate('not a date')).toBe('');
  });
});
