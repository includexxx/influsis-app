import { describe, expect, test } from '@jest/globals';
import { generateHandleSuggestions } from './handleSuggestions';
import { handleSchema } from '@/utils/onboardingSchemas';

describe('generateHandleSuggestions', () => {
  test('is deterministic for a given name + city', () => {
    const first = generateHandleSuggestions('Ayesha Rahman', 'Dhaka');
    const second = generateHandleSuggestions('Ayesha Rahman', 'Dhaka');
    expect(first).toEqual(second);
    expect(first).toEqual(['ayesharahman1', 'ayesharahman_dhaka', 'ayesharahman.creator']);
  });

  test('every suggestion passes handleSchema and the list is capped at 3', () => {
    const suggestions = generateHandleSuggestions('Ayesha Rahman', 'Dhaka');
    expect(suggestions.length).toBeLessThanOrEqual(3);
    for (const suggestion of suggestions) {
      expect(handleSchema.safeParse(suggestion).success).toBe(true);
    }
  });

  test('never suggests the taken handle back', () => {
    const suggestions = generateHandleSuggestions('Ayesha Rahman', 'Dhaka', 'ayesharahman1');
    expect(suggestions).not.toContain('ayesharahman1');
  });

  test('returns [] when the name yields no usable slug', () => {
    expect(generateHandleSuggestions('', 'Dhaka')).toEqual([]);
    expect(generateHandleSuggestions('!!!', 'Dhaka')).toEqual([]);
    expect(generateHandleSuggestions(undefined, undefined)).toEqual([]);
  });

  test('falls back to name-only suffixes when no city is given', () => {
    expect(generateHandleSuggestions('Ayesha Rahman')).toEqual([
      'ayesharahman1',
      'ayesharahman.creator',
      'ayesharahman_creator',
    ]);
  });
});
