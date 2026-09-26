import { describe, expect, test } from '@jest/globals';
import { formatMemberSince, getCreatorBadge } from './earningsCard';

describe('formatMemberSince', () => {
  test('renders month and year of the account creation date', () => {
    expect(formatMemberSince('2026-08-13T12:00:00.000Z')).toBe('Creator since Aug 2026');
  });

  test('returns null for a missing or invalid date', () => {
    expect(formatMemberSince(null)).toBeNull();
    expect(formatMemberSince('not-a-date')).toBeNull();
  });
});

describe('getCreatorBadge', () => {
  test('marks verified creators', () => {
    expect(getCreatorBadge('verified')).toEqual({ label: 'Verified Creator', verified: true });
  });

  test('treats every other status as unverified', () => {
    expect(getCreatorBadge('pending')).toEqual({ label: 'Unverified', verified: false });
    expect(getCreatorBadge(undefined)).toEqual({ label: 'Unverified', verified: false });
  });
});
