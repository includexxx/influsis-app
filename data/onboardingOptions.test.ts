import { describe, expect, test } from '@jest/globals';
import { DELIVERABLE_OPTIONS, LANGUAGE_OPTIONS, OTHER_OPTION_VALUE } from './onboardingOptions';

describe('onboardingOptions', () => {
  test('LANGUAGE_OPTIONS has the six requirements languages, Others last', () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(6);
    expect(LANGUAGE_OPTIONS[LANGUAGE_OPTIONS.length - 1].value).toBe(OTHER_OPTION_VALUE);
    expect(LANGUAGE_OPTIONS.map(option => option.value)).toEqual([
      'english',
      'spanish',
      'french',
      'russian',
      'hindi',
      'others',
    ]);
  });

  test('DELIVERABLE_OPTIONS has six entries and no Others', () => {
    expect(DELIVERABLE_OPTIONS).toHaveLength(6);
    expect(DELIVERABLE_OPTIONS.map(option => option.value)).not.toContain(OTHER_OPTION_VALUE);
    expect(DELIVERABLE_OPTIONS).toContainEqual({ value: 'photo-post', label: 'Photo Post' });
  });
});
