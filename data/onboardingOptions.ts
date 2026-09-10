// Fixed option sets for the creator onboarding Languages (step 6) and
// Deliverables (step 7) multi-selects (build-plan 20d; step numbers shifted by
// build-plan 20h split of Categories/Subcategories and 21's Bio step;
// creator-onboarding-requirements.md §3 Screens 6-7). Values are written out
// literally so they stay stable against a future backend contract.

export interface OnboardingOption {
  value: string;
  label: string;
}

// Selecting this language row reveals a free-text "add a language" input
// (languages only - deliverables has no "Others").
export const OTHER_OPTION_VALUE = 'others';

export const LANGUAGE_OPTIONS: OnboardingOption[] = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'russian', label: 'Russian' },
  { value: 'hindi', label: 'Hindi' },
  { value: OTHER_OPTION_VALUE, label: 'Others' },
];

export const DELIVERABLE_OPTIONS: OnboardingOption[] = [
  { value: 'photo-post', label: 'Photo Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'video', label: 'Video' },
  { value: 'story', label: 'Story' },
  { value: 'blog', label: 'Blog' },
  { value: 'live', label: 'Live' },
];
