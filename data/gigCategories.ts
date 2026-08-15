import { SelectFieldOption } from '@/components/elements/SelectField';

// Options for the Create Gig "Category" field (Figma node 6525:6068 shows
// only the empty "Select category" placeholder - no option list is
// specified in the design). Content-type labels reused from the
// profile-verification flow's own category set
// (`scenes/profile-verification/ContentCategories.tsx`) so a creator's gig
// categories line up with the content categories they picked when
// onboarding, rather than inventing an unrelated taxonomy.
export const gigCategories: SelectFieldOption[] = [
  { label: 'Education', value: 'education' },
  { label: 'Beauty & Life Style', value: 'beauty' },
  { label: 'Travel', value: 'travel' },
  { label: 'Music', value: 'music' },
  { label: 'Gym & Body Building', value: 'gym' },
  { label: 'Sports', value: 'sports' },
  { label: 'Health', value: 'health' },
];
