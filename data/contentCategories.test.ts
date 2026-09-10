import { describe, expect, test } from '@jest/globals';
import {
  CONTENT_CATEGORY_OPTIONS,
  OTHERS_CATEGORY_VALUE,
  SUBCATEGORIES_BY_CATEGORY,
  getSubcategories,
} from './contentCategories';

describe('contentCategories', () => {
  test('has the eight requirements categories, Others last', () => {
    expect(CONTENT_CATEGORY_OPTIONS).toHaveLength(8);
    expect(CONTENT_CATEGORY_OPTIONS[CONTENT_CATEGORY_OPTIONS.length - 1].value).toBe(
      OTHERS_CATEGORY_VALUE,
    );
    expect(CONTENT_CATEGORY_OPTIONS.map(option => option.value)).toEqual([
      'education',
      'beauty',
      'travel',
      'music',
      'gym',
      'sports',
      'health',
      'others',
    ]);
  });

  test('every non-Others category resolves to a non-empty subcategory list', () => {
    for (const option of CONTENT_CATEGORY_OPTIONS) {
      if (option.value === OTHERS_CATEGORY_VALUE) continue;
      expect(getSubcategories(option.value).length).toBeGreaterThan(0);
    }
  });

  test('getSubcategories is empty for Others and unknown values', () => {
    expect(getSubcategories(OTHERS_CATEGORY_VALUE)).toEqual([]);
    expect(getSubcategories('nope')).toEqual([]);
  });

  test('subcategory values are kebab-cased labels', () => {
    expect(SUBCATEGORIES_BY_CATEGORY.education).toContainEqual({
      value: 'academic-study-tips',
      label: 'Academic/Study Tips',
    });
    expect(SUBCATEGORIES_BY_CATEGORY.travel).toContainEqual({
      value: 'local-travel-bd',
      label: 'Local Travel (BD)',
    });
  });

  test('Gym and Health keep distinct nutrition subcategory values', () => {
    const gym = getSubcategories('gym').map(option => option.value);
    const health = getSubcategories('health').map(option => option.value);
    expect(gym).toContain('nutrition-diet');
    expect(health).toContain('nutrition');
    expect(health).not.toContain('nutrition-diet');
  });
});
