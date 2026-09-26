import { ImageSourcePropType } from 'react-native';
import { gigs as allGigs } from './gigs';
import { creators as allCreators } from './creators';

// Mock content for the Home screen (scenes/main/Home.tsx), standing in for
// a real campaigns/gigs API - see docs/screen/home/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). Kept separate from the
// scene file so the scene stays focused on layout/composition rather than
// content, and so this data has one obvious place to eventually be replaced
// by a real API response shape.
//
// "Business" itself no longer reads from here - scenes/home/components/
// BusinessLogosSection.tsx fetches the real business directory instead
// (scenes/business/api/businessDirectoryApi.ts).

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

// The canonical creator list (data/creators.ts) - Home's "Top Rated
// Creator" row is a preview of the same creators the full
// /top-creators list and Creator Profile screen (`/creator/[id]`)
// share, not a separate identity-less mock set. Previously five plain
// `creator-1..5.jpg` headshots with no id to link a tap to a profile -
// see docs/screen/creator-profile/README.md "Scope notes".
export const topRatedCreators = allCreators.map(({ id, image }) => ({ id, image }));
