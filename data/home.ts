import { ImageSourcePropType } from 'react-native';
import { gigs as allGigs } from './gigs';

// Mock content for the Home screen (scenes/home/Home.tsx), standing in for
// a real campaigns/gigs API - see docs/screen/home/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). Kept separate from the
// scene file so the scene stays focused on layout/composition rather than
// content, and so this data has one obvious place to eventually be replaced
// by a real API response shape.
//
// "Business" and "Top Rated Creator" no longer read from here -
// scenes/home/components/BusinessLogosSection.tsx and
// TopRatedCreatorsSection.tsx fetch the real directories instead
// (scenes/business/api/businessDirectoryApi.ts,
// scenes/creator/api/creatorDirectoryApi.ts).

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

// First two of the canonical gig list (data/gigs.ts) - Home's "Top Gigs"
// row is a preview of the same gigs the full /top-gigs list and Gig
// Details screen (`/gig/[id]`) share, not a separate mock set.
export const gigs = allGigs.slice(0, 2);
