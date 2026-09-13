// Content taxonomy for the creator onboarding Content Categories (step 4) and
// Subcategories (step 5) steps (build-plan 20c, split into two steps by
// build-plan 20h, shifted down one by 21's Bio step;
// creator-onboarding-requirements.md §3 Screens 4-5). The eight
// categories reuse `data/gigCategories.ts`'s values so a creator's onboarding
// categories and their gig categories share one taxonomy, plus `others` for
// the free-text branch. Subcategory `value`s are the requirements-doc labels
// lower-cased with each run of non-alphanumeric characters collapsed to a
// single hyphen and edge hyphens trimmed - written out literally here rather
// than computed, so they stay stable against a future backend contract.

export interface ContentCategoryOption {
  value: string;
  label: string;
}

// The `Others` category takes a free-text "Please specify" category name on
// step 4 and a free-text subcategory name on step 5; both fold back in as a
// category and a subcategory at payload-assembly time (build-plan 20g/20h).
export const OTHERS_CATEGORY_VALUE = 'others';

export const CONTENT_CATEGORY_OPTIONS: ContentCategoryOption[] = [
  { value: 'education', label: 'Education' },
  { value: 'beauty', label: 'Beauty & Lifestyle' },
  { value: 'travel', label: 'Travel' },
  { value: 'music', label: 'Music' },
  { value: 'gym', label: 'Gym & Body Building' },
  { value: 'sports', label: 'Sports' },
  { value: 'health', label: 'Health' },
  { value: OTHERS_CATEGORY_VALUE, label: 'Others' },
];

// Suggested subcategory set from the requirements doc. `Others` is absent -
// it has no checklist. Note the deliberate split between Gym's `nutrition-diet`
// ("Nutrition/Diet") and Health's `nutrition` ("Nutrition").
export const SUBCATEGORIES_BY_CATEGORY: Record<string, ContentCategoryOption[]> = {
  education: [
    { value: 'academic-study-tips', label: 'Academic/Study Tips' },
    { value: 'language-learning', label: 'Language Learning' },
    { value: 'career-skills', label: 'Career/Skills' },
    { value: 'kids-education', label: 'Kids Education' },
  ],
  beauty: [
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'haircare', label: 'Haircare' },
    { value: 'fashion-styling', label: 'Fashion/Styling' },
    { value: 'home-decor', label: 'Home & Decor' },
  ],
  travel: [
    { value: 'local-travel-bd', label: 'Local Travel (BD)' },
    { value: 'international-travel', label: 'International Travel' },
    { value: 'budget-travel', label: 'Budget Travel' },
    { value: 'adventure-trekking', label: 'Adventure/Trekking' },
  ],
  music: [
    { value: 'singing', label: 'Singing' },
    { value: 'instrumental', label: 'Instrumental' },
    { value: 'covers', label: 'Covers' },
    { value: 'music-production', label: 'Music Production' },
  ],
  gym: [
    { value: 'weight-training', label: 'Weight Training' },
    { value: 'home-workout', label: 'Home Workout' },
    { value: 'nutrition-diet', label: 'Nutrition/Diet' },
    { value: 'bodybuilding-prep', label: 'Bodybuilding Prep' },
  ],
  sports: [
    { value: 'cricket', label: 'Cricket' },
    { value: 'football', label: 'Football' },
    { value: 'fitness-challenges', label: 'Fitness Challenges' },
    { value: 'other-sports', label: 'Other Sports' },
  ],
  health: [
    { value: 'mental-health', label: 'Mental Health' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'yoga-wellness', label: 'Yoga/Wellness' },
    { value: 'medical-health-tips', label: 'Medical/Health Tips' },
  ],
};

/** Subcategory options for a category value; `[]` for `others` or an unknown. */
export function getSubcategories(categoryValue: string): ContentCategoryOption[] {
  return SUBCATEGORIES_BY_CATEGORY[categoryValue] ?? [];
}
