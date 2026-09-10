import { describe, expect, test } from '@jest/globals';
import {
  ageInYears,
  basicInformationSchema,
  categoriesStepSchema,
  subcategoriesStepSchema,
  deliverablesSchema,
  handleSchema,
  languagesSchema,
  locationSchema,
  MINIMUM_CREATOR_AGE,
  OTHERS_TEXT_MAX_LENGTH,
  photosSchema,
  portfolioFormSchema,
} from './onboardingSchemas';

// `basicInformationSchema` reads the real clock (its refine calls
// `ageInYears` with a default `new Date()`), so anchor the fixtures to the
// same clock rather than a hard-coded date - that keeps the exact-birthday
// boundary cases stable on any run day.
const NOW = new Date();

/** ISO string for a birthday `years` before NOW, shifted by `offsetDays`. */
function dobFor(years: number, offsetDays = 0): string {
  const d = new Date(NOW);
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

const validBasics = {
  name: 'Ayesha Rahman',
  gender: 'female' as const,
  dateOfBirth: dobFor(21),
};

describe('ageInYears', () => {
  test('counts whole years and ignores an unreached birthday this year', () => {
    expect(ageInYears(dobFor(20), NOW)).toBe(20);
    expect(ageInYears(dobFor(20, -1), NOW)).toBe(19); // birthday is tomorrow
  });

  test('returns NaN for an unparseable string', () => {
    expect(Number.isNaN(ageInYears('not-a-date', NOW))).toBe(true);
  });
});

describe('basicInformationSchema', () => {
  test('accepts a complete adult entry', () => {
    expect(basicInformationSchema.safeParse(validBasics).success).toBe(true);
  });

  test('trims the name and rejects a blank one', () => {
    expect(basicInformationSchema.safeParse({ ...validBasics, name: '   ' }).success).toBe(false);
  });

  test('rejects a missing gender and an off-list gender', () => {
    expect(basicInformationSchema.safeParse({ ...validBasics, gender: undefined }).success).toBe(
      false,
    );
    expect(basicInformationSchema.safeParse({ ...validBasics, gender: 'yes' }).success).toBe(false);
  });

  test('rejects an empty date of birth', () => {
    expect(basicInformationSchema.safeParse({ ...validBasics, dateOfBirth: '' }).success).toBe(
      false,
    );
  });

  test(`rejects someone under ${MINIMUM_CREATOR_AGE}`, () => {
    const r = basicInformationSchema.safeParse({
      ...validBasics,
      dateOfBirth: dobFor(MINIMUM_CREATOR_AGE - 1),
    });
    expect(r.success).toBe(false);
  });

  test(`accepts someone who just turned ${MINIMUM_CREATOR_AGE}`, () => {
    const r = basicInformationSchema.safeParse({
      ...validBasics,
      dateOfBirth: dobFor(MINIMUM_CREATOR_AGE),
    });
    expect(r.success).toBe(true);
  });

  test('rejects a date of birth one day short of the minimum age', () => {
    const r = basicInformationSchema.safeParse({
      ...validBasics,
      dateOfBirth: dobFor(MINIMUM_CREATOR_AGE, -1),
    });
    expect(r.success).toBe(false);
  });
});

describe('locationSchema', () => {
  const validLocation = {
    country: 'bangladesh' as const,
    division: 'dhaka' as const,
    city: 'Dhaka',
    zip: '1207',
  };

  test('accepts a complete Bangladesh entry', () => {
    expect(locationSchema.safeParse(validLocation).success).toBe(true);
  });

  test('accepts a missing zip (optional)', () => {
    const { zip: _zip, ...noZip } = validLocation;
    expect(locationSchema.safeParse(noZip).success).toBe(true);
  });

  test('rejects a missing or off-list division', () => {
    expect(locationSchema.safeParse({ ...validLocation, division: undefined }).success).toBe(false);
    expect(locationSchema.safeParse({ ...validLocation, division: 'punjab' }).success).toBe(false);
  });

  test('rejects an empty city', () => {
    expect(locationSchema.safeParse({ ...validLocation, city: '' }).success).toBe(false);
  });

  test('rejects a free-text city that is not a real district', () => {
    expect(locationSchema.safeParse({ ...validLocation, city: 'Nowhere' }).success).toBe(false);
  });

  test('rejects a city that belongs to a different division', () => {
    const r = locationSchema.safeParse({ ...validLocation, division: 'sylhet', city: 'Dhaka' });
    expect(r.success).toBe(false);
  });

  test('rejects a non-Bangladesh country in V1', () => {
    expect(locationSchema.safeParse({ ...validLocation, country: 'united-states' }).success).toBe(
      false,
    );
  });
});

describe('categoriesStepSchema (step 3)', () => {
  test('rejects an empty category selection', () => {
    expect(categoriesStepSchema.safeParse({ categories: [], categoryOthersText: '' }).success).toBe(
      false,
    );
  });

  test('accepts categories without any subcategories (those are step 4)', () => {
    const r = categoriesStepSchema.safeParse({
      categories: [
        { value: 'music', subcategories: [] },
        { value: 'travel', subcategories: [] },
      ],
    });
    expect(r.success).toBe(true);
  });

  test('rejects an Others selection with blank or whitespace text', () => {
    expect(
      categoriesStepSchema.safeParse({
        categories: [{ value: 'others', subcategories: [] }],
        categoryOthersText: '   ',
      }).success,
    ).toBe(false);
  });

  test('accepts an Others selection once specify text is given', () => {
    const r = categoriesStepSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      categoryOthersText: 'Gardening',
    });
    expect(r.success).toBe(true);
  });

  test('rejects category specify text longer than the max length', () => {
    const r = categoriesStepSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      categoryOthersText: 'x'.repeat(OTHERS_TEXT_MAX_LENGTH + 1),
    });
    expect(r.success).toBe(false);
  });
});

describe('subcategoriesStepSchema (step 4)', () => {
  test('rejects a selected category with no subcategory', () => {
    const r = subcategoriesStepSchema.safeParse({
      categories: [{ value: 'music', subcategories: [] }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['categories', 0, 'subcategories']);
    }
  });

  test('accepts two categories that each have a subcategory', () => {
    const r = subcategoriesStepSchema.safeParse({
      categories: [
        { value: 'music', subcategories: ['singing'] },
        { value: 'travel', subcategories: ['budget-travel', 'adventure-trekking'] },
      ],
    });
    expect(r.success).toBe(true);
  });

  test('the Others category needs a non-empty subcategory specify text, not a checklist', () => {
    const blank = subcategoriesStepSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      subcategoryOthersText: '  ',
    });
    expect(blank.success).toBe(false);
    if (!blank.success) {
      expect(blank.error.issues[0].path).toEqual(['subcategoryOthersText']);
    }
    expect(
      subcategoriesStepSchema.safeParse({
        categories: [{ value: 'others', subcategories: [] }],
        subcategoryOthersText: 'Balcony gardening',
      }).success,
    ).toBe(true);
  });

  test('rejects subcategory specify text longer than the max length', () => {
    const r = subcategoriesStepSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      subcategoryOthersText: 'x'.repeat(OTHERS_TEXT_MAX_LENGTH + 1),
    });
    expect(r.success).toBe(false);
  });
});

describe('languagesSchema / deliverablesSchema', () => {
  test('both reject an empty selection', () => {
    expect(languagesSchema.safeParse({ selected: [] }).success).toBe(false);
    expect(deliverablesSchema.safeParse({ selected: [] }).success).toBe(false);
  });

  test('both accept a single preset pick', () => {
    expect(languagesSchema.safeParse({ selected: ['english'] }).success).toBe(true);
    expect(deliverablesSchema.safeParse({ selected: ['reel'] }).success).toBe(true);
  });

  test('languages with Others selected needs a non-empty othersText', () => {
    const blank = languagesSchema.safeParse({ selected: ['others'], othersText: '  ' });
    expect(blank.success).toBe(false);
    if (!blank.success) {
      expect(blank.error.issues[0].path).toEqual(['othersText']);
    }
    expect(languagesSchema.safeParse({ selected: ['others'], othersText: 'Bengali' }).success).toBe(
      true,
    );
  });

  test('languages rejects an over-long othersText', () => {
    expect(
      languagesSchema.safeParse({
        selected: ['others'],
        othersText: 'x'.repeat(OTHERS_TEXT_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  test('deliverables ignores othersText entirely', () => {
    expect(deliverablesSchema.safeParse({ selected: ['others'], othersText: '' }).success).toBe(
      true,
    );
  });
});

describe('photosSchema', () => {
  const photo = { uri: 'file:///p.jpg', mimeType: 'image/jpeg', fileName: 'p.jpg' };

  test('accepts an empty object (both photos optional)', () => {
    expect(photosSchema.safeParse({}).success).toBe(true);
  });

  test('accepts one photo, the other, or both', () => {
    expect(photosSchema.safeParse({ profilePhoto: photo }).success).toBe(true);
    expect(photosSchema.safeParse({ coverPhoto: photo }).success).toBe(true);
    expect(photosSchema.safeParse({ profilePhoto: photo, coverPhoto: photo }).success).toBe(true);
  });

  test('accepts a photo without mimeType / fileName', () => {
    expect(photosSchema.safeParse({ profilePhoto: { uri: 'file:///p.jpg' } }).success).toBe(true);
  });

  test('rejects a photo with a blank uri', () => {
    expect(photosSchema.safeParse({ profilePhoto: { uri: '' } }).success).toBe(false);
  });
});

describe('portfolioFormSchema', () => {
  const entry = { id: 'e1', url: 'instagram.com/p/abc', platform: 'instagram' as const };

  test('accepts an empty list (the step is optional)', () => {
    expect(portfolioFormSchema.safeParse({ entries: [] }).success).toBe(true);
  });

  test('accepts a valid entry, with or without a thumbnail', () => {
    expect(portfolioFormSchema.safeParse({ entries: [entry] }).success).toBe(true);
    expect(
      portfolioFormSchema.safeParse({
        entries: [{ ...entry, thumbnail: { uri: 'file:///t.jpg' } }],
      }).success,
    ).toBe(true);
  });

  test('rejects a blank or malformed url on the entry path', () => {
    const r = portfolioFormSchema.safeParse({ entries: [{ ...entry, url: 'not a link' }] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['entries', 0, 'url']);
    }
    expect(portfolioFormSchema.safeParse({ entries: [{ ...entry, url: '' }] }).success).toBe(false);
  });

  test('rejects an off-list platform', () => {
    expect(
      portfolioFormSchema.safeParse({ entries: [{ ...entry, platform: 'facebook' }] }).success,
    ).toBe(false);
  });
});

describe('handleSchema', () => {
  test('accepts a well-formed handle', () => {
    expect(handleSchema.safeParse('ayesha_rahman').success).toBe(true);
    expect(handleSchema.safeParse('a.b.c').success).toBe(true);
    expect(handleSchema.safeParse('abc').success).toBe(true);
  });

  test('rejects a handle shorter than 3 or longer than 20 characters', () => {
    expect(handleSchema.safeParse('ab').success).toBe(false);
    expect(handleSchema.safeParse('a'.repeat(21)).success).toBe(false);
  });

  test('rejects uppercase letters, spaces, and other symbols', () => {
    expect(handleSchema.safeParse('Ayesha').success).toBe(false);
    expect(handleSchema.safeParse('ab c').success).toBe(false);
    expect(handleSchema.safeParse('ab-c').success).toBe(false);
  });

  test('rejects a leading or trailing . or _', () => {
    expect(handleSchema.safeParse('_abc').success).toBe(false);
    expect(handleSchema.safeParse('abc_').success).toBe(false);
    expect(handleSchema.safeParse('.abc').success).toBe(false);
    expect(handleSchema.safeParse('abc.').success).toBe(false);
  });
});
