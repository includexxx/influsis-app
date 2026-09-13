import { Business } from '@/types';

// Mock content for the Businesses screen (scenes/main/Businesses.tsx), standing in
// for a real businesses API - see docs/screen/businesses/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet).

// Figma repeats a small set of real logos across its 24 grid cells (node
// 6010:16780) - row 1 (KFC/Bkash Ltd/Bkash/Uber) reuses the exact same four
// images already extracted for Home's "Business" row (assets/images/home/
// business-logo-*.jpg), then rows 2/5 and row 4 each repeat verbatim, and row 6
// swaps in three new logos. Mirrored here (including row 1's mismatched
// "Bkash Ltd" label on what's visibly the Bata logo) rather than inventing
// distinct business names/logos Figma doesn't specify, same as data/home.ts,
// data/search.ts, data/liveCampaigns.ts and data/campaigns.ts.

// Business Details (Figma node 6001:37719, docs/screen/business-details) shows a
// single example business profile - banner photo, avatar, name, verified
// badge, website, description, and two ongoing campaigns (the same
// "Bkash Branding Campaign" cards already in data/campaigns.ts, referenced
// here by id rather than duplicated) - applied identically to every business
// below rather than inventing distinct profile content Figma doesn't
// specify, same as data/creators.ts's bio/reviews and data/gigs.ts's
// service breakdown.
const detailFields = {
  name: 'Bkash Ltd. Company',
  verified: true,
  bannerImage: require('@/assets/images/business-details/banner.jpg'),
  avatar: require('@/assets/images/business-details/avatar.jpg'),
  website: 'https://food.net',
  description:
    "Described by Queenstown House & Garden magazine as having 'one of the best views we've ever seen' you will love relaxing in this newly built",
  campaignIds: ['campaign-1', 'campaign-2'],
};

export const businesses: Business[] = [
  // Row 1
  {
    id: 'business-1',
    source: require('@/assets/images/home/business-logo-2.jpg'),
    label: 'KFC Ltd',
    ...detailFields,
  },
  {
    id: 'business-2',
    source: require('@/assets/images/home/business-logo-1.jpg'),
    label: 'Bkash Ltd',
    ...detailFields,
  },
  {
    id: 'business-3',
    source: require('@/assets/images/home/business-logo-5.jpg'),
    label: 'Bkash',
    ...detailFields,
  },
  {
    id: 'business-4',
    source: require('@/assets/images/home/business-logo-4.jpg'),
    label: 'Uber',
    ...detailFields,
  },
  // Row 2
  {
    id: 'business-5',
    source: require('@/assets/images/businesses/kay.jpg'),
    label: 'Kay',
    ...detailFields,
  },
  {
    id: 'business-6',
    source: require('@/assets/images/businesses/eastasy.jpg'),
    label: 'Eastasy',
    ...detailFields,
  },
  {
    id: 'business-7',
    source: require('@/assets/images/businesses/aarong.jpg'),
    label: 'Aarong',
    ...detailFields,
  },
  {
    id: 'business-8',
    source: require('@/assets/images/businesses/xiomi.jpg'),
    label: 'Xiomi',
    ...detailFields,
  },
  // Row 3
  {
    id: 'business-9',
    source: require('@/assets/images/businesses/techno.jpg'),
    label: 'Techno',
    ...detailFields,
  },
  {
    id: 'business-10',
    source: require('@/assets/images/businesses/robi.jpg'),
    label: 'Robi',
    ...detailFields,
  },
  {
    id: 'business-11',
    source: require('@/assets/images/businesses/gp.jpg'),
    label: 'GP',
    ...detailFields,
  },
  {
    id: 'business-12',
    source: require('@/assets/images/home/business-logo-3.jpg'),
    label: 'Pathao',
    ...detailFields,
  },
  // Row 4
  {
    id: 'business-13',
    source: require('@/assets/images/home/business-logo-1.jpg'),
    label: 'Bkash Ltd',
    ...detailFields,
  },
  {
    id: 'business-14',
    source: require('@/assets/images/home/business-logo-1.jpg'),
    label: 'Bkash Ltd',
    ...detailFields,
  },
  {
    id: 'business-15',
    source: require('@/assets/images/home/business-logo-5.jpg'),
    label: 'Bkash',
    ...detailFields,
  },
  {
    id: 'business-16',
    source: require('@/assets/images/home/business-logo-4.jpg'),
    label: 'Uber',
    ...detailFields,
  },
  // Row 5
  {
    id: 'business-17',
    source: require('@/assets/images/businesses/kay.jpg'),
    label: 'Kay',
    ...detailFields,
  },
  {
    id: 'business-18',
    source: require('@/assets/images/businesses/eastasy.jpg'),
    label: 'Eastasy',
    ...detailFields,
  },
  {
    id: 'business-19',
    source: require('@/assets/images/businesses/aarong.jpg'),
    label: 'Aarong',
    ...detailFields,
  },
  {
    id: 'business-20',
    source: require('@/assets/images/businesses/xiomi.jpg'),
    label: 'Xiomi',
    ...detailFields,
  },
  // Row 6
  {
    id: 'business-21',
    source: require('@/assets/images/businesses/techno.jpg'),
    label: 'Techno',
    ...detailFields,
  },
  {
    id: 'business-22',
    source: require('@/assets/images/businesses/realme.jpg'),
    label: 'Realme',
    ...detailFields,
  },
  {
    id: 'business-23',
    source: require('@/assets/images/businesses/vivo.jpg'),
    label: 'Vivo',
    ...detailFields,
  },
  {
    id: 'business-24',
    source: require('@/assets/images/businesses/oneplus.jpg'),
    label: 'One Plus',
    ...detailFields,
  },
];
