import { ImageSourcePropType } from 'react-native';
import { Campaign, Gig } from '@/types';

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

export const gigs: Gig[] = [
  {
    id: 'gig-1',
    image: require('@/assets/images/home/gig-1.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
  {
    id: 'gig-2',
    image: require('@/assets/images/home/gig-2.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
  },
];

export const topRatedInfluencerAvatars: ImageSourcePropType[] = [
  require('@/assets/images/home/influencer-1.jpg'),
  require('@/assets/images/home/influencer-2.jpg'),
  require('@/assets/images/home/influencer-3.jpg'),
  require('@/assets/images/home/influencer-4.jpg'),
  require('@/assets/images/home/influencer-5.jpg'),
];
