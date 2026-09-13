import { describe, expect, test } from '@jest/globals';
import { editProfileSchema } from './profileSchemas';

const base = {
  name: 'Ayesha Rahman',
  categories: [],
  subcategories: [],
  languages: [],
  deliverables: [],
  portfolio: [],
  isDiscoverable: true,
};

describe('editProfileSchema', () => {
  test('accepts a minimal valid value with every optional field blank', () => {
    const result = editProfileSchema.safeParse({
      ...base,
      handle: '',
      gender: '',
      dateOfBirth: '',
      bio: '',
      country: '',
      state: '',
      contactEmail: '',
      websiteUrl: '',
    });
    expect(result.success).toBe(true);
  });

  test('requires a non-empty name', () => {
    const result = editProfileSchema.safeParse({ ...base, name: '' });
    expect(result.success).toBe(false);
  });

  test('reuses handleSchema: rejects a malformed non-empty handle', () => {
    const result = editProfileSchema.safeParse({ ...base, handle: 'a' });
    expect(result.success).toBe(false);
  });

  test('accepts a well-formed handle', () => {
    const result = editProfileSchema.safeParse({ ...base, handle: 'ayesha_rahman' });
    expect(result.success).toBe(true);
  });

  test('bio must be 20-300 characters when present, but blank is allowed', () => {
    expect(editProfileSchema.safeParse({ ...base, bio: 'too short' }).success).toBe(false);
    expect(editProfileSchema.safeParse({ ...base, bio: '' }).success).toBe(true);
    expect(
      editProfileSchema.safeParse({
        ...base,
        bio: 'A long enough bio that clears the twenty character minimum easily.',
      }).success,
    ).toBe(true);
  });

  test('websiteUrl requires a scheme when present', () => {
    expect(editProfileSchema.safeParse({ ...base, websiteUrl: 'not-a-url' }).success).toBe(false);
    expect(
      editProfileSchema.safeParse({ ...base, websiteUrl: 'https://example.com' }).success,
    ).toBe(true);
  });

  test('contactEmail must be a valid email when present', () => {
    expect(editProfileSchema.safeParse({ ...base, contactEmail: 'not-an-email' }).success).toBe(
      false,
    );
    expect(editProfileSchema.safeParse({ ...base, contactEmail: 'a@b.com' }).success).toBe(true);
  });

  test('dateOfBirth enforces the minimum age when present', () => {
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 5);
    expect(
      editProfileSchema.safeParse({ ...base, dateOfBirth: tooYoung.toISOString() }).success,
    ).toBe(false);
    expect(
      editProfileSchema.safeParse({ ...base, dateOfBirth: '2001-04-12T00:00:00.000Z' }).success,
    ).toBe(true);
  });

  test('state must be one of the eight Bangladeshi divisions when present', () => {
    expect(editProfileSchema.safeParse({ ...base, state: 'not-a-division' }).success).toBe(false);
    expect(editProfileSchema.safeParse({ ...base, state: 'dhaka' }).success).toBe(true);
  });
});
