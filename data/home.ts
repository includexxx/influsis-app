import { ImageSourcePropType } from 'react-native';
import { gigs as allGigs } from './gigs';
import { influencers as allInfluencers } from './influencers';
import { brands as allBrands } from './brands';

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

// {id, source} pairs from the canonical brand list (data/brands.ts), picked
// by id to reproduce the same five brand-logo-1..5.jpg images in the same
// order this row showed before - previously a plain `ImageSourcePropType[]`
// with no id to link a tap to a brand profile, the same "identity-less"
// gap docs/screen/influencer-profile/README.md describes fixing for
// topRatedInfluencers below.
const homeBrandIds = ['brand-2', 'brand-1', 'brand-12', 'brand-4', 'brand-3'];
export const brandLogos = homeBrandIds
  .map(id => allBrands.find(brand => brand.id === id))
  .filter((brand): brand is (typeof allBrands)[number] => !!brand)
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

// The canonical influencer list (data/influencers.ts) - Home's "Top Rated
// Influencer" row is a preview of the same influencers the full
// /top-influencers list and Influencer Profile screen (`/influencer/[id]`)
// share, not a separate identity-less mock set. Previously five plain
// `influencer-1..5.jpg` headshots with no id to link a tap to a profile -
// see docs/screen/influencer-profile/README.md "Scope notes".
export const topRatedInfluencers = allInfluencers.map(({ id, image }) => ({ id, image }));
