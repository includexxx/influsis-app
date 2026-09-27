import { describe, expect, test } from '@jest/globals';
import { applyDefaultValues, applySchema, toApplyPayload } from './applySchema';

const valid = { ...applyDefaultValues, pitch: 'I post food reels', amount: '4,500.50' };

function firstError(values: object) {
  const result = applySchema.safeParse({ ...valid, ...values });
  return result.success ? null : result.error.issues[0].message;
}

describe('applySchema', () => {
  test('accepts a pitch and an amount with separators and decimals', () => {
    expect(applySchema.safeParse(valid).success).toBe(true);
  });

  test('requires a pitch and caps it at 2000 characters', () => {
    expect(firstError({ pitch: '   ' })).toBe('Tell the business why you are a good fit');
    expect(firstError({ pitch: 'a'.repeat(2001) })).toBe('Keep it under 2000 characters');
  });

  test.each([
    ['', 'Enter your rate'],
    ['abc', 'Enter a number, like 4500'],
    ['12.345', 'Enter a number, like 4500'],
    ['0', 'Your rate must be more than 0'],
  ])('rejects amount %p', (amount, message) => {
    expect(firstError({ amount })).toBe(message);
  });

  test('allows empty links but rejects malformed ones', () => {
    expect(firstError({ linkOne: '', linkTwo: 'instagram.com/me' })).toBeNull();
    expect(firstError({ linkOne: 'not a link' })).toBe('Enter a valid link');
  });
});

describe('toApplyPayload', () => {
  test('converts the rate to minor units and adds https:// to bare links', () => {
    expect(
      toApplyPayload({
        pitch: '  I post food reels  ',
        amount: '4,500.50',
        linkOne: 'instagram.com/me',
        linkTwo: 'http://example.com/work',
      }),
    ).toEqual({
      pitch: 'I post food reels',
      proposedAmountMinor: 450050,
      portfolioUrls: ['https://instagram.com/me', 'http://example.com/work'],
    });
  });

  test('omits portfolioUrls when no link was entered', () => {
    expect(toApplyPayload({ ...valid, amount: '4500' })).toEqual({
      pitch: 'I post food reels',
      proposedAmountMinor: 450000,
    });
  });
});
