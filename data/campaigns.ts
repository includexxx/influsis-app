import { Campaign } from '@/types';

// Canonical campaign list - the single source of truth for every screen
// that shows campaigns (Home's "Active Campaigns" hero row and "Campaigns"
// list section, the full /campaigns list, /live-campaign, /search results,
// Brand Details' "Ongoing Campaign" section, and the Campaign Details
// screen at /campaign/[id], which looks a tapped campaign up here by id
// regardless of which screen the tap came from). Consolidated the same way
// data/gigs.ts and data/influencers.ts already are - see
// docs/screen/campaign-details/README.md "Data consolidation". Previously
// five separate arrays (this file, data/home.ts, data/liveCampaigns.ts,
// data/search.ts) with disjoint, non-overlapping ids and no shared lookup;
// each screen below now sources its specific entries from the one array
// defined here instead of defining its own literals.

// Campaign Details (Figma node 6001:37641, docs/screen/campaign-details)
// shows a single example campaign - budget/duration/follower stats, an
// "About campaign" paragraph, requirements, three deliverables, an "About
// the brand" paragraph, a website link and an application deadline -
// applied identically to every campaign below rather than inventing
// distinct detail content Figma doesn't specify, same as data/brands.ts's
// bannerImage/avatar/description and data/gigs.ts's service breakdown.
// Figma's own banner/avatar photos are the exact same asset pair already
// extracted for Brand Details (same hashes) - reused directly rather than
// re-exporting duplicates. Figma's "About the brand" paragraph is
// corrupted into four back-to-back copies of the same sentence pasted
// together (node 6001:37699) - a designer text-entry error, not
// intentional repeated content like the mismatches this project otherwise
// preserves - so only one clean copy is kept here.
const detailFields = {
  bannerImage: require('@/assets/images/brand-details/banner.jpg'),
  avatar: require('@/assets/images/brand-details/avatar.jpg'),
  brandName: 'Bkash Ltd. Company',
  budget: '500-1000',
  duration: '15 days',
  followerWanted: 'Up to 200k',
  about:
    "We're looking for fashion-forward influencers to showcase our new summer collection. Create authentic content that highlights the versatility and style of our pieces while sharing your personal fashion story.",
  requirements: [
    '10,000+ Instagram followers',
    'Fashion/Lifestyle content focus',
    'High engagement rate (>2%)',
    'Based in United States',
    'Age 18+',
  ],
  deliverables: [
    {
      title: 'Instagram Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
    {
      title: 'Facebook Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
    {
      title: 'Tiktok Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
  ],
  brandDescription:
    'FashionBrand is a contemporary fashion label known for its sustainable practices and modern designs. Our mission is to create stylish, eco-conscious clothing for the fashion-forward generation.',
  website: 'https://food.net',
  applicationDeadline: 'Feb 28, 2024',
};

// Originally this file's only content (Campaigns screen, scenes/main/
// Campaigns.tsx, and Brand Details' "Ongoing Campaign" section via
// data/brands.ts's campaignIds) - see docs/screen/campaigns/README.md
// "Scope notes" for why all four cards share the same "Bkash Branding
// Campaign" / "Bkash Ltd." content.
export const campaigns: Campaign[] = [
  {
    ...detailFields,
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
    ...detailFields,
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
    ...detailFields,
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
    ...detailFields,
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

// Originally data/home.ts's activeCampaigns (Home's "Active Campaigns" hero
// row, CampaignCard variant="hero") - moved here so Campaign Details has a
// single canonical list to look any tapped campaign up in. Re-exported from
// data/home.ts under the same name so that scene's import is unchanged.
export const activeCampaigns: Campaign[] = [
  {
    ...detailFields,
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
    ...detailFields,
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

// Originally data/home.ts's campaigns (Home's "Campaigns" list section,
// CampaignCard variant="list") - moved here for the same reason, re-exported
// from data/home.ts as `campaigns` so that scene's import is unchanged.
export const homeCampaigns: Campaign[] = [
  {
    ...detailFields,
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
    ...detailFields,
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
    ...detailFields,
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
    ...detailFields,
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

// Originally data/liveCampaigns.ts (Live Campaigns screen, scenes/main/
// LiveCampaign.tsx) - moved here for the same reason, re-exported from
// data/liveCampaigns.ts so that scene's import is unchanged. See
// docs/screen/live-campaign/README.md "Scope notes" for why seven of the
// eight cards share "Bkash Branding Campaign" while the second uses the
// longer "Summer Unisex T-Shirt Fashion Collection Campaigns" title.
export const liveCampaigns: Campaign[] = [
  {
    ...detailFields,
    id: 'live-1',
    image: require('@/assets/images/home/hero-campaign.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-2',
    image: require('@/assets/images/home/campaign-list-1.jpg'),
    title: 'Summer Unisex T-Shirt Fashion Collection Campaigns',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-3',
    image: require('@/assets/images/home/campaign-list-2.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-4',
    image: require('@/assets/images/home/campaign-list-3.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-5',
    image: require('@/assets/images/home/campaign-list-4.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-6',
    image: require('@/assets/images/home/popular-campaign-1.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-7',
    image: require('@/assets/images/home/popular-campaign-2.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
  {
    ...detailFields,
    id: 'live-8',
    image: require('@/assets/images/home/popular-campaign-3.jpg'),
    title: 'Bkash Branding Campaign',
    brandName: 'Bkash Ltd.',
    verified: true,
    status: 'Ongoing',
    price: '$2,000',
    dueDate: '21 Oct 2022',
  },
];

// Originally data/search.ts's searchResults (Search screen result cards,
// scenes/main/Search.tsx) - moved here for the same reason, re-exported
// from data/search.ts so that scene's import is unchanged.
export const searchResults: Campaign[] = [
  {
    ...detailFields,
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
    ...detailFields,
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
    ...detailFields,
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

// Every campaign shown anywhere in the app, concatenated - what Campaign
// Details (scenes/main/CampaignDetails.tsx) looks a tapped id up in.
export const allCampaigns: Campaign[] = [
  ...campaigns,
  ...activeCampaigns,
  ...homeCampaigns,
  ...liveCampaigns,
  ...searchResults,
];
