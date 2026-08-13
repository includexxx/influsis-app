import { Gig } from '@/types';

// Mock content for the Top Gigs screen (scenes/main/TopGigs.tsx), standing
// in for a real gigs API - see docs/screen/top-gigs/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). The first and third
// cards reuse the exact same photos already extracted for Home's "Top
// Gigs" row (assets/images/home/gig-1.jpg, gig-2.jpg); the rest are new
// (assets/images/gigs/). Figma repeats the same "TikTok, Facebook, Youtube"
// / "$350" / "I will create facebook promotion, youtube, tiktok promotion"
// content across all five cards - mirrored here rather than inventing
// distinct gig copy Figma doesn't specify, same as every other screen's
// mock data this project has built so far.
export const topGigs: Gig[] = [
  {
    id: 'top-gig-1',
    image: require('@/assets/images/home/gig-1.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
  {
    id: 'top-gig-2',
    image: require('@/assets/images/gigs/ribbon.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
  {
    id: 'top-gig-3',
    image: require('@/assets/images/home/gig-2.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
  {
    id: 'top-gig-4',
    image: require('@/assets/images/gigs/nature.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
  {
    id: 'top-gig-5',
    image: require('@/assets/images/gigs/paper-leaves.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
];
