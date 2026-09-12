import { describe, expect, test } from '@jest/globals';
import { buildCreatorOnboardingBody } from './onboardingPayload';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';

const fullState: CreatorOnboardingState = {
  currentStep: 10,
  completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  completed: false,
  basics: { name: 'Ayesha Rahman', gender: 'female', dateOfBirth: '2001-04-12T00:00:00.000Z' },
  bio: 'Skincare creator in Dhaka sharing honest, budget-friendly routines.',
  location: { country: 'bangladesh', division: 'dhaka', city: 'Dhaka', zip: '1207' },
  contentCategories: {
    categories: [
      { value: 'music', subcategories: ['singing'] },
      { value: 'travel', subcategories: ['adventure-trekking'] },
    ],
    categoryOthersText: '',
    subcategoryOthersText: '',
  },
  languages: { selected: ['english', 'bengali'], othersText: '' },
  deliverables: { selected: ['reel', 'story'] },
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
  currentStep: 10,
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

describe('buildCreatorOnboardingBody', () => {
  test('a fully-populated state maps every field, including media keys', () => {
    const body = buildCreatorOnboardingBody(fullState, {
      profilePhoto: 'profile-images/p1.jpg',
      coverPhoto: 'profile-images/c1.jpg',
      portfolioThumbnails: { e1: 'profile-images/t1.jpg' },
    });

    expect(body).toEqual({
      name: 'Ayesha Rahman',
      gender: 'female',
      dateOfBirth: '2001-04-12T00:00:00.000Z',
      bio: 'Skincare creator in Dhaka sharing honest, budget-friendly routines.',
      country: 'bangladesh',
      state: 'dhaka',
      city: 'Dhaka',
      zip: '1207',
      handle: 'ayesha_rahman',
      categories: ['music', 'travel'],
      subcategories: ['singing', 'adventure-trekking'],
      languages: ['english', 'bengali'],
      deliverables: ['reel', 'story'],
      portfolio: [
        { url: 'instagram.com/p/abc', platform: 'instagram', thumbnail: 'profile-images/t1.jpg' },
        { url: 'https://youtu.be/xyz', platform: 'youtube' },
      ],
      profilePhoto: 'profile-images/p1.jpg',
      coverPhoto: 'profile-images/c1.jpg',
    });
  });

  // Regression guard: the wizard's onFinish previously omitted `bio` from the
  // state it handed to the payload builder, so it never reached the server.
  test('bio is included', () => {
    const body = buildCreatorOnboardingBody(fullState);
    expect(body.bio).toBe('Skincare creator in Dhaka sharing honest, budget-friendly routines.');
  });

  // location.division -> body.state (the backend column name, not the slice's).
  test('location.division maps to the "state" field', () => {
    const body = buildCreatorOnboardingBody(fullState);
    expect(body.state).toBe('dhaka');
    expect(body).not.toHaveProperty('division');
  });

  test('a minimal state omits every field it has no value for, never sending ""', () => {
    const body = buildCreatorOnboardingBody(minimalState);

    expect(body.handle).toBe('sam_creator');
    expect(body).not.toHaveProperty('bio');
    expect(body).not.toHaveProperty('zip');
    expect(body).not.toHaveProperty('portfolio');
    expect(body).not.toHaveProperty('profilePhoto');
    expect(body).not.toHaveProperty('coverPhoto');
  });

  test('folds the "Others" category free text into the category and its subcategory', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      contentCategories: {
        categories: [{ value: 'others', subcategories: [] }],
        categoryOthersText: 'Gardening',
        subcategoryOthersText: 'Balcony gardening',
      },
    });
    expect(body.categories).toEqual(['Gardening']);
    expect(body.subcategories).toEqual(['Balcony gardening']);
  });

  test('an "Others" category without its own subcategory text falls back to the category text', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      contentCategories: {
        categories: [{ value: 'others', subcategories: [] }],
        categoryOthersText: 'Gardening',
      },
    });
    expect(body.subcategories).toEqual(['Gardening']);
  });

  test('flattens multiple categories into deduped category and subcategory arrays', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      contentCategories: {
        categories: [
          { value: 'music', subcategories: ['singing', 'covers'] },
          { value: 'travel', subcategories: ['singing'] }, // shared subcategory across categories
        ],
      },
    });
    expect(body.categories).toEqual(['music', 'travel']);
    expect(body.subcategories).toEqual(['singing', 'covers']); // deduped
  });

  // Regression guard: the predecessor folded "Others" for categories but
  // shipped the literal string 'others' for languages, losing the typed value.
  test('folds the "Others" language free text into the languages array, never shipping the literal "others"', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      languages: { selected: ['english', 'others'], othersText: 'Bengali' },
    });
    expect(body.languages).toEqual(['english', 'Bengali']);
    expect(body.languages).not.toContain('others');
  });

  test('an "Others" language with no typed text is dropped rather than sending the raw "others" key', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      languages: { selected: ['english', 'others'] },
    });
    // No othersText to fall back to: the literal value ships (same "no data
    // to substitute" behavior as categories), but it's still worth asserting
    // explicitly so a future change here is a deliberate one.
    expect(body.languages).toEqual(['english', 'others']);
  });

  test('deliverables are deduped but not otherwise transformed', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      deliverables: { selected: ['reel', 'reel', 'story'] },
    });
    expect(body.deliverables).toEqual(['reel', 'story']);
  });

  test('caps categories at 20', () => {
    const categories = Array.from({ length: 25 }, (_, i) => ({
      value: `cat-${i}`,
      subcategories: [] as string[],
    }));
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      contentCategories: { categories },
    });
    expect(body.categories).toHaveLength(20);
  });

  test('caps portfolio at 20', () => {
    const portfolio = Array.from({ length: 25 }, (_, i) => ({
      id: `e${i}`,
      url: `instagram.com/p/${i}`,
      platform: 'instagram' as const,
    }));
    const body = buildCreatorOnboardingBody({ ...minimalState, portfolio });
    expect(body.portfolio).toHaveLength(20);
  });

  test('a portfolio entry only gets a thumbnail key when one was uploaded for its id', () => {
    const body = buildCreatorOnboardingBody(
      {
        ...minimalState,
        portfolio: [
          { id: 'has-thumb', url: 'instagram.com/p/a', platform: 'instagram' },
          { id: 'no-thumb', url: 'instagram.com/p/b', platform: 'instagram' },
        ],
      },
      { portfolioThumbnails: { 'has-thumb': 'profile-images/t.jpg' } },
    );
    expect(body.portfolio).toEqual([
      { url: 'instagram.com/p/a', platform: 'instagram', thumbnail: 'profile-images/t.jpg' },
      { url: 'instagram.com/p/b', platform: 'instagram' },
    ]);
  });

  test('a free-text portfolio platform (e.g. "others") passes through unchanged', () => {
    const body = buildCreatorOnboardingBody({
      ...minimalState,
      portfolio: [{ id: 'e1', url: 'facebook.com/p/a', platform: 'others' }],
    });
    expect(body.portfolio).toEqual([{ url: 'facebook.com/p/a', platform: 'others' }]);
  });
});
