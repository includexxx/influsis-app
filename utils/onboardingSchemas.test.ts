import { describe, expect, test } from '@jest/globals';
import {
  ageInYears,
  basicInformationSchema,
  contentCategoriesSchema,
  locationSchema,
  MINIMUM_CREATOR_AGE,
  OTHERS_TEXT_MAX_LENGTH,
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

describe('contentCategoriesSchema', () => {
  test('rejects an empty category selection', () => {
    expect(contentCategoriesSchema.safeParse({ categories: [], othersText: '' }).success).toBe(
      false,
    );
  });

  test('rejects a selected category with no subcategory', () => {
    const r = contentCategoriesSchema.safeParse({
      categories: [{ value: 'music', subcategories: [] }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['categories', 0, 'subcategories']);
    }
  });

  test('accepts two categories that each have a subcategory', () => {
    const r = contentCategoriesSchema.safeParse({
      categories: [
        { value: 'music', subcategories: ['singing'] },
        { value: 'travel', subcategories: ['budget-travel', 'adventure-trekking'] },
      ],
    });
    expect(r.success).toBe(true);
  });

  test('rejects an Others selection with blank or whitespace text', () => {
    expect(
      contentCategoriesSchema.safeParse({
        categories: [{ value: 'others', subcategories: [] }],
        othersText: '   ',
      }).success,
    ).toBe(false);
  });

  test('accepts an Others selection once specify text is given', () => {
    const r = contentCategoriesSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      othersText: 'Gardening',
    });
    expect(r.success).toBe(true);
  });

  test('rejects specify text longer than the max length', () => {
    const r = contentCategoriesSchema.safeParse({
      categories: [{ value: 'others', subcategories: [] }],
      othersText: 'x'.repeat(OTHERS_TEXT_MAX_LENGTH + 1),
    });
    expect(r.success).toBe(false);
  });
});
