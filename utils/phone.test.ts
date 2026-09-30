import { describe, expect, test } from '@jest/globals';
import { isE164, looksLikePhone, normalizeIdentifier, toE164 } from './phone';

describe('toE164', () => {
  test('joins the dial code and national digits', () => {
    expect(toE164('+880', '1521702480')).toBe('+8801521702480');
  });

  test('strips formatting and the trunk zero from the national part', () => {
    expect(toE164('+880', '01521-702 480')).toBe('+8801521702480');
    expect(toE164('880', '(01521) 702480')).toBe('+8801521702480');
  });
});

describe('isE164', () => {
  test('matches the backend shape', () => {
    expect(isE164('+8801521702480')).toBe(true);
    expect(isE164('+12025550142')).toBe(true);
    expect(isE164('8801521702480')).toBe(false);
    expect(isE164('+880')).toBe(false);
    expect(isE164('+0123456789')).toBe(false);
  });
});

describe('looksLikePhone', () => {
  test('digits with spacing punctuation are a phone; anything with @ is not', () => {
    expect(looksLikePhone('01521702480')).toBe(true);
    expect(looksLikePhone('+880 1521-702480')).toBe(true);
    expect(looksLikePhone('a@b.co')).toBe(false);
    expect(looksLikePhone('abc')).toBe(false);
    expect(looksLikePhone('123')).toBe(false);
  });
});

describe('normalizeIdentifier', () => {
  test('trims and lowercases an email', () => {
    expect(normalizeIdentifier('  Creator@Influsis.Test ')).toBe('creator@influsis.test');
  });

  test('keeps an E.164 phone', () => {
    expect(normalizeIdentifier('+8801521702480')).toBe('+8801521702480');
    expect(normalizeIdentifier('+1 (202) 555-0142')).toBe('+12025550142');
  });

  test('adds the default dial code to a local number', () => {
    expect(normalizeIdentifier('01521702480')).toBe('+8801521702480');
    expect(normalizeIdentifier('1521 702 480')).toBe('+8801521702480');
  });

  test('recognises 00 and bare country-code prefixes', () => {
    expect(normalizeIdentifier('008801521702480')).toBe('+8801521702480');
    expect(normalizeIdentifier('8801521702480')).toBe('+8801521702480');
  });

  test('honours a different default dial code', () => {
    expect(normalizeIdentifier('2025550142', '+1')).toBe('+12025550142');
  });

  test('leaves anything else for the backend to judge', () => {
    expect(normalizeIdentifier('creator')).toBe('creator');
  });
});
