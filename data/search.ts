// Mock content for the Search screen (scenes/main/Search.tsx), standing in
// for a real search API - see docs/screen/search/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet).

export const searchCategories: string[] = [
  'Food',
  'Sports',
  'Beauty',
  'Entertainment',
  'Education',
];

// The canonical campaign list (data/campaigns.ts) - the single source of
// truth every campaign-related screen (including the Campaign Details
// `/campaign/[id]` lookup) now shares.
export { searchResults } from './campaigns';
