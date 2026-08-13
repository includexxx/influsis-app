import { Influencer } from '@/types';

// Mock content for the Top Influencers screen (scenes/main/TopInfluencers.tsx),
// standing in for a real influencers API - see
// docs/screen/top-influencers/README.md "Scope notes" and docs/PRD.md
// §2.2/§4.1 (no backend exists yet). Figma repeats the same "Dhaka,
// Bangladesh" location/tags and "2.5M" / "4.8%" stats across all four
// cards, and reuses "Salman Muqtadir" for three of the four names -
// mirrored here rather than inventing distinct influencer names/stats
// Figma doesn't specify, same as every other screen's mock data.
export const topInfluencers: Influencer[] = [
  {
    id: 'influencer-1',
    image: require('@/assets/images/influencers/sunehra-tasnim.jpg'),
    name: 'Sunehra tasnim',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
  },
  {
    id: 'influencer-2',
    image: require('@/assets/images/influencers/salman-muqtadir-1.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
  },
  {
    id: 'influencer-3',
    image: require('@/assets/images/influencers/salman-muqtadir-2.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
  },
  {
    id: 'influencer-4',
    image: require('@/assets/images/influencers/influencer-4.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
  },
];
