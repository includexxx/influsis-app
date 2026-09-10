import { describe, expect, test } from '@jest/globals';
import { ageInYears, basicInformationSchema, MINIMUM_CREATOR_AGE } from './onboardingSchemas';

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
