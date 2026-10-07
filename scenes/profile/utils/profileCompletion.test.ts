import { describe, expect, test } from '@jest/globals';
import { CreatorProfile } from '@/types';
import { completionHint, getProfileCompletion, verificationBadge } from './profileCompletion';

const emptyProfile: CreatorProfile = {
  id: 'p-1',
  name: 'Ayesha Rahman',
  bio: null,
  categories: [],
  subcategories: [],
  languages: [],
  deliverables: [],
  platforms: [],
  portfolio: [],
  dateOfBirth: null,
  gender: null,
  country: null,
  state: null,
  city: null,
  postalCode: null,
  address: null,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  avatarUrl: null,
  coverUrl: null,
  isDiscoverable: true,
  verificationDocumentsUrl: null,
  verificationStatus: 'unverified',
  verificationNotes: null,
  verifiedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const fullProfile: CreatorProfile = {
  ...emptyProfile,
  bio: 'Skincare creator.',
  categories: ['beauty'],
  languages: ['english'],
  deliverables: ['reel'],
  platforms: [{ platform: 'instagram', handle: 'ayesha' }],
  portfolio: [{ url: 'instagram.com/p/a', platform: 'instagram', thumbnailUrl: null }],
  city: 'Dhaka',
  contactEmail: 'a@b.com',
  avatarUrl: 'media/avatar.png',
  coverUrl: 'media/cover.png',
};

describe('getProfileCompletion', () => {
  test('an empty profile is 0% with every check missing', () => {
    const result = getProfileCompletion(emptyProfile);
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(10);
    expect(result.missing[0]).toBe('profile photo');
  });

  test('a filled-in profile is 100% with nothing missing', () => {
    expect(getProfileCompletion(fullProfile)).toEqual({ percent: 100, missing: [] });
  });

  test('counts each check once and ignores a whitespace-only bio', () => {
    const result = getProfileCompletion({ ...fullProfile, bio: '   ', coverUrl: null });
    expect(result.percent).toBe(80);
    expect(result.missing).toEqual(['cover photo', 'bio']);
  });

  test('either a phone or an email satisfies contact details', () => {
    const result = getProfileCompletion({
      ...fullProfile,
      contactEmail: null,
      contactPhone: '+8801700000000',
    });
    expect(result.missing).not.toContain('contact details');
  });
});

describe('completionHint', () => {
  test('names one, two, or two-plus-a-count missing fields', () => {
    expect(completionHint([])).toBe('Your profile is complete');
    expect(completionHint(['bio'])).toBe('Add your bio');
    expect(completionHint(['bio', 'portfolio'])).toBe('Add your bio and portfolio');
    expect(completionHint(['bio', 'portfolio', 'languages', 'location'])).toBe(
      'Add your bio, portfolio and 2 more',
    );
  });
});

describe('verificationBadge', () => {
  test('maps each backend status to a tone', () => {
    expect(verificationBadge('verified').tone).toBe('verified');
    expect(verificationBadge('pending').tone).toBe('pending');
    expect(verificationBadge('unverified').tone).toBe('unverified');
    expect(verificationBadge('rejected').tone).toBe('unverified');
  });
});
