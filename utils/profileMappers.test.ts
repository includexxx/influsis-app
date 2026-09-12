import { describe, expect, test } from '@jest/globals';
import { MyProfileResponse } from '@/types';
import { toEditProfileDefaults, toUpdateMyProfileRequest } from './profileMappers';
import { EditProfileValues } from './profileSchemas';

const response: MyProfileResponse = {
  kind: 'creator',
  handle: 'ayesha',
  profile: {
    id: 'p-1',
    name: 'Ayesha Rahman',
    bio: 'Skincare creator.',
    categories: ['music'],
    subcategories: ['singing'],
    languages: ['english'],
    deliverables: ['reel'],
    platforms: [],
    portfolio: [
      { url: 'instagram.com/p/a', platform: 'instagram', thumbnailUrl: 'https://cdn.test/t.jpg' },
    ],
    dateOfBirth: '2001-04-12T00:00:00.000Z',
    gender: 'female',
    country: 'bangladesh',
    state: 'dhaka',
    city: 'Dhaka',
    postalCode: '1207',
    address: null,
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    avatarUrl: 'https://cdn.test/avatar.jpg',
    coverUrl: null,
    isDiscoverable: true,
    verificationDocumentsUrl: null,
    verificationStatus: 'unverified',
    verificationNotes: null,
    verifiedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

describe('toEditProfileDefaults', () => {
  test('maps nulls to the empty-field value', () => {
    const defaults = toEditProfileDefaults(response);
    expect(defaults.address).toBe('');
    expect(defaults.contactEmail).toBe('');
    expect(defaults.coverPhoto).toBeUndefined();
  });

  test('maps present values straight across', () => {
    const defaults = toEditProfileDefaults(response);
    expect(defaults.name).toBe('Ayesha Rahman');
    expect(defaults.handle).toBe('ayesha');
    expect(defaults.avatarPhoto).toEqual({ uri: 'https://cdn.test/avatar.jpg' });
    expect(defaults.categories).toEqual(['music']);
  });

  test('gives each portfolio item a synthetic client-side id and maps its thumbnail to a PickedImageAsset', () => {
    const defaults = toEditProfileDefaults(response);
    expect(defaults.portfolio).toHaveLength(1);
    expect(defaults.portfolio[0].id).toEqual(expect.any(String));
    expect(defaults.portfolio[0].thumbnail).toEqual({ uri: 'https://cdn.test/t.jpg' });
  });

  test('a missing handle maps to an empty string, not null', () => {
    const defaults = toEditProfileDefaults({ ...response, handle: null });
    expect(defaults.handle).toBe('');
  });
});

const baseValues: EditProfileValues = {
  name: 'Ayesha Rahman',
  handle: 'ayesha',
  gender: 'female',
  dateOfBirth: '2001-04-12T00:00:00.000Z',
  bio: 'Skincare creator.',
  country: 'bangladesh',
  state: 'dhaka',
  city: 'Dhaka',
  postalCode: '1207',
  address: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  categories: ['music'],
  subcategories: ['singing'],
  languages: ['english'],
  deliverables: ['reel'],
  portfolio: [],
  isDiscoverable: true,
};

describe('toUpdateMyProfileRequest', () => {
  test('an empty dirty-fields map produces an empty body', () => {
    const body = toUpdateMyProfileRequest(baseValues, {});
    expect(body).toEqual({});
  });

  test('only dirty fields appear in the body', () => {
    const body = toUpdateMyProfileRequest(baseValues, { bio: true });
    expect(Object.keys(body)).toEqual(['bio']);
    expect(body.bio).toBe('Skincare creator.');
  });

  test('a dirty field cleared to "" is sent as explicit null, not ""', () => {
    const body = toUpdateMyProfileRequest({ ...baseValues, websiteUrl: '' }, { websiteUrl: true });
    expect(body.websiteUrl).toBeNull();
    expect(body.websiteUrl).not.toBe('');
  });

  test('an untouched array field is not resent, even though it has a value', () => {
    const body = toUpdateMyProfileRequest(baseValues, { bio: true });
    expect(body).not.toHaveProperty('categories');
    expect(body).not.toHaveProperty('portfolio');
  });

  test('a dirty avatarPhoto sends the uploaded key as avatarUrl', () => {
    const body = toUpdateMyProfileRequest(
      baseValues,
      { avatarPhoto: true },
      { avatarUrl: 'profile-images/new.jpg' },
    );
    expect(body.avatarUrl).toBe('profile-images/new.jpg');
  });

  test('a dirty portfolio maps entries and attaches thumbnails by entry id', () => {
    const values: EditProfileValues = {
      ...baseValues,
      portfolio: [
        { id: 'e1', url: 'instagram.com/p/a', platform: 'instagram' },
        { id: 'e2', url: 'youtube.com/x', platform: 'youtube' },
      ],
    };
    const body = toUpdateMyProfileRequest(
      values,
      { portfolio: true },
      { portfolioThumbnails: { e1: 'profile-images/t1.jpg' } },
    );
    expect(body.portfolio).toEqual([
      { url: 'instagram.com/p/a', platform: 'instagram', thumbnail: 'profile-images/t1.jpg' },
      { url: 'youtube.com/x', platform: 'youtube', thumbnail: undefined },
    ]);
  });

  test('handle is only sent when non-empty, even if marked dirty', () => {
    const body = toUpdateMyProfileRequest({ ...baseValues, handle: '' }, { handle: true });
    expect(body).not.toHaveProperty('handle');
  });
});
