import { Campaign } from '@/types';

// Mock content for the Campaigns screen (scenes/main/Campaigns.tsx),
// standing in for a real campaigns API - see
// docs/screen/campaigns/README.md "Scope notes" and docs/PRD.md §2.2/§4.1
// (no backend exists yet). Reuses the campaign photos already extracted for
// Home (assets/images/home) rather than exporting duplicates.
//
// Figma repeats "Bkash Branding Campaign" / "Bkash Ltd." across all four
// cards (node 6010:17203/17235/17260/17285), differing only by photo and
// whether a services line is present (the first card omits it) - mirrored
// here rather than inventing distinct campaign names Figma doesn't specify,
// same as data/home.ts, data/search.ts and data/liveCampaigns.ts.
export const campaigns: Campaign[] = [
  {
    id: 'campaign-1',
    image: require('@/assets/images/home/hero-campaign.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'campaign-2',
    image: require('@/assets/images/home/campaign-list-1.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    servicesDescription: '3 Tiktok Video, 1 Youtube Reel,  2 Facebook Post',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'campaign-3',
    image: require('@/assets/images/home/campaign-list-2.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    servicesDescription: '3 Tiktok Video, 1 Youtube Reel,  2 Facebook Post',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'campaign-4',
    image: require('@/assets/images/home/campaign-list-3.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    servicesDescription: '3 Tiktok Video, 1 Youtube Reel,  2 Facebook Post',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
];
