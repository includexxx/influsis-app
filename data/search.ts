import { Campaign } from '@/types';

// Mock content for the Search screen (scenes/main/Search.tsx), standing in
// for a real search API - see docs/screen/search/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). Reuses the campaign
// photos already extracted for Home (assets/images/home) rather than
// exporting duplicates of the same stock photography Figma reuses across
// screens.

export const searchCategories: string[] = [
  'Food',
  'Sports',
  'Beauty',
  'Entertainment',
  'Education',
];

// Figma repeats the same "Summer Unisex T-Shirt Fashion Collection
// Campaigns" / "Bkash Ltd." content across all three result cards (node
// 6119:6389/6478/6500) - mirrored here rather than inventing distinct
// campaign names Figma doesn't specify, same as data/home.ts's "Popular
// Campaigns"/"Campaigns" sections.
export const searchResults: Campaign[] = [
  {
    id: 'search-1',
    image: require('@/assets/images/home/campaign-list-1.jpg'),
    title: 'Summer Unisex T-Shirt Fashion Collection Campaigns',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'search-2',
    image: require('@/assets/images/home/campaign-list-2.jpg'),
    title: 'Summer Unisex T-Shirt Fashion Collection Campaigns',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'search-3',
    image: require('@/assets/images/home/campaign-list-3.jpg'),
    title: 'Summer Unisex T-Shirt Fashion Collection Campaigns',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
];
