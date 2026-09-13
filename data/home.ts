import { ImageSourcePropType } from 'react-native';
import { gigs as allGigs } from './gigs';
import { creators as allCreators } from './creators';
import { businesses as allBusinesses } from './businesses';

// Mock content for the Home screen (scenes/main/Home.tsx), standing in for
// a real campaigns/gigs API - see docs/screen/home/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet). Kept separate from the
// scene file so the scene stays focused on layout/composition rather than
// content, and so this data has one obvious place to eventually be replaced
// by a real API response shape.

// Both re-exported from the canonical campaign list (data/campaigns.ts) -
// see docs/screen/campaign-details/README.md "Data consolidation" for why
// this moved out of a local literal array.
export { activeCampaigns } from './campaigns';
export { homeCampaigns as campaigns } from './campaigns';

// {id, source} pairs from the canonical business list (data/businesses.ts), picked
// by id to reproduce the same five business-logo-1..5.jpg images in the same
// order this row showed before - previously a plain `ImageSourcePropType[]`
// with no id to link a tap to a business profile, the same "identity-less"
// gap docs/screen/creator-profile/README.md describes fixing for
// topRatedCreators below.
const homeBusinessIds = ['business-2', 'business-1', 'business-12', 'business-4', 'business-3'];
export const businessLogos = homeBusinessIds
  .map(id => allBusinesses.find(business => business.id === id))
  .filter((business): business is (typeof allBusinesses)[number] => !!business)
  .map(({ id, source }) => ({ id, source }));

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
