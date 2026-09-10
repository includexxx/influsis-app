import { describe, expect, test } from '@jest/globals';
import { buildOnboardingSubmission } from './onboardingPayload';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';

const fullState: CreatorOnboardingState = {
  currentStep: 8,
  completedSteps: [1, 2, 3, 4, 5, 6, 7],
  completed: false,
  basics: { name: 'Ayesha Rahman', gender: 'female', dateOfBirth: '2001-04-12T00:00:00.000Z' },
  location: { country: 'bangladesh', division: 'dhaka', city: 'Dhaka', zip: '1207' },
  contentCategories: {
    categories: [
      { value: 'music', subcategories: ['singing'] },
      { value: 'travel', subcategories: ['adventure-trekking'] },
    ],
    othersText: '',
  },
  languages: { selected: ['english', 'bengali'], othersText: '' },
  deliverables: { selected: ['reel', 'story'], othersText: '' },
  profilePhoto: { uri: 'file:///profile.jpg', mimeType: 'image/jpeg', fileName: 'profile.jpg' },
  coverPhoto: { uri: 'file:///cover.png', mimeType: 'image/png', fileName: 'cover.png' },
  portfolio: [
    {
      id: 'e1',
      url: 'instagram.com/p/abc',
      platform: 'instagram',
      thumbnail: { uri: 'file:///thumb.jpg', mimeType: 'image/jpeg', fileName: 'thumb.jpg' },
    },
    { id: 'e2', url: 'https://youtu.be/xyz', platform: 'youtube' },
  ],
  handle: 'ayesha_rahman',
};

const minimalState: CreatorOnboardingState = {
  currentStep: 8,
  completedSteps: [],
  completed: false,
  basics: { name: 'Sam', gender: 'other', dateOfBirth: '2000-01-01T00:00:00.000Z' },
  location: { country: 'bangladesh', division: 'sylhet', city: 'Sylhet' },
  contentCategories: { categories: [{ value: 'music', subcategories: ['singing'] }] },
  languages: { selected: ['english'] },
  deliverables: { selected: ['reel'] },
  portfolio: [],
  handle: 'sam_creator',
};

describe('buildOnboardingSubmission', () => {
  test('a fully-populated state produces the expected flat summary', () => {
    const { summary } = buildOnboardingSubmission(fullState);

    expect(summary).toMatchObject({
      name: 'Ayesha Rahman',
      gender: 'female',
      dateOfBirth: '2001-04-12T00:00:00.000Z',
      country: 'bangladesh',
      division: 'dhaka',
      city: 'Dhaka',
      zip: '1207',
      handle: 'ayesha_rahman',
      categories: ['music', 'travel'],
      languages: ['english', 'bengali'],
      deliverables: ['reel', 'story'],
      portfolio: [
        { url: 'instagram.com/p/abc', platform: 'instagram' },
        { url: 'https://youtu.be/xyz', platform: 'youtube' },
      ],
      photoCount: 2,
      portfolioCount: 2,
      portfolioThumbnailCount: 1,
    });
  });

  test('file parts in the summary are reduced to { fileName, mimeType }', () => {
    const { summary } = buildOnboardingSubmission(fullState);
    expect(summary.profilePhoto).toEqual({ fileName: 'profile.jpg', mimeType: 'image/jpeg' });
    expect(summary.coverPhoto).toEqual({ fileName: 'cover.png', mimeType: 'image/png' });
  });

  test('a minimal state still builds and omits the file keys', () => {
    const { summary } = buildOnboardingSubmission(minimalState);
    expect(summary.handle).toBe('sam_creator');
    expect(summary).not.toHaveProperty('profilePhoto');
    expect(summary).not.toHaveProperty('coverPhoto');
    expect(summary).not.toHaveProperty('zip');
    expect(summary.photoCount).toBe(0);
    expect(summary.portfolioCount).toBe(0);
    expect(summary.portfolioThumbnailCount).toBe(0);
  });

  test('formData is a FormData carrying the handle', () => {
    const { formData } = buildOnboardingSubmission(fullState);
    expect(formData).toBeInstanceOf(FormData);
    // React Native's FormData polyfill has no `get`; only assert when present.
    if (typeof (formData as { get?: unknown }).get === 'function') {
      expect((formData as unknown as { get(name: string): unknown }).get('handle')).toBe(
        'ayesha_rahman',
      );
    }
  });
});
