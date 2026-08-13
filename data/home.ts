import { ImageSourcePropType } from 'react-native';
import { Campaign } from '@/types';
import { gigs as allGigs } from './gigs';
import { influencers as allInfluencers } from './influencers';

// Mock content for the Home screen (scenes/main/Home.tsx), standing in for
// a real campaigns/gigs API - see docs/screen/home/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). Kept separate from the
// scene file so the scene stays focused on layout/composition rather than
// content, and so this data has one obvious place to eventually be replaced
// by a real API response shape.

export const activeCampaigns: Campaign[] = [
  {
    id: 'kfc-branding',
    image: require('@/assets/images/home/hero-campaign.jpg'),
    brandAvatar: require('@/assets/images/home/hero-brand-avatar.jpg'),
    title: 'KFC Branding Campaign',
    verified: true,
    tags: ['Male', 'Female'],
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'bkash-branding-hero',
    image: require('@/assets/images/home/campaign-list-1.jpg'),
    brandAvatar: require('@/assets/images/home/hero-brand-avatar.jpg'),
    title: 'Bkash Branding Campaign',
    verified: true,
    tags: ['Male', 'Female'],
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
];

export const brandLogos: ImageSourcePropType[] = [
  require('@/assets/images/home/brand-logo-1.jpg'),
  require('@/assets/images/home/brand-logo-2.jpg'),
  require('@/assets/images/home/brand-logo-3.jpg'),
  require('@/assets/images/home/brand-logo-4.jpg'),
  require('@/assets/images/home/brand-logo-5.jpg'),
];

export interface PopularCampaign {
  id: string;
  image: ImageSourcePropType;
  startedLabel: string;
  title: string;
}

export const popularCampaigns: PopularCampaign[] = [
  {
    id: 'popular-1',
    image: require('@/assets/images/home/popular-campaign-1.jpg'),
    startedLabel: 'Started 10 July',
    title: 'Bkash Branding Campaign',
  },
  {
    id: 'popular-2',
    image: require('@/assets/images/home/popular-campaign-2.jpg'),
    startedLabel: 'Started 10 July',
    title: 'Bkash Branding Campaign',
  },
  {
    id: 'popular-3',
    image: require('@/assets/images/home/popular-campaign-3.jpg'),
    startedLabel: 'Started 10 July',
    title: 'Bkash Branding Campaign',
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'bkash-1',
    image: require('@/assets/images/home/campaign-list-1.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'bkash-2',
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
    id: 'bkash-3',
    image: require('@/assets/images/home/campaign-list-3.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    servicesDescription: '3 Tiktok Video, 1 Youtube Reel,  2 Facebook Post',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    id: 'bkash-4',
    image: require('@/assets/images/home/campaign-list-4.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    tags: ['Male', 'Female'],
    servicesDescription: '3 Tiktok Video, 1 Youtube Reel,  2 Facebook Post',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
];

// First two of the canonical gig list (data/gigs.ts) - Home's "Top Gigs"
// row is a preview of the same gigs the full /top-gigs list and Gig
// Details screen (`/gig/[id]`) share, not a separate mock set.
export const gigs = allGigs.slice(0, 2);

// The canonical influencer list (data/influencers.ts) - Home's "Top Rated
// Influencer" row is a preview of the same influencers the full
// /top-influencers list and Influencer Profile screen (`/influencer/[id]`)
// share, not a separate identity-less mock set. Previously five plain
// `influencer-1..5.jpg` headshots with no id to link a tap to a profile -
// see docs/screen/influencer-profile/README.md "Scope notes".
export const topRatedInfluencers = allInfluencers.map(({ id, image }) => ({ id, image }));
