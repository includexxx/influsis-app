import { AppliedCampaign, CampaignRequest } from '@/types';

// Mock content for the Applications screen (scenes/main/Applications.tsx,
// Figma "List", nodes 6015:7090 "Applied" tab + 6475:6394 "Request" tab) -
// standing in for a real applications API, same as every other screen (see
// docs/PRD.md §2.2/§4.1). Reuses photos already extracted for Home rather
// than exporting duplicates - see docs/screen/apply-campaign/
// campaign-list.md "Scope notes" for which Home asset each card's Figma
// photo most closely matches.

// "Applied" tab - Figma repeats "Bkash Branding Campaign" / "$299.99" /
// "Applied 10 July" across all 4 cards (only the photo differs), mirrored
// here rather than inventing distinct titles/prices Figma doesn't specify,
// the same convention data/campaigns.ts and data/liveCampaigns.ts follow.
export const appliedCampaigns: AppliedCampaign[] = [
  {
    id: 'applied-1',
    image: require('@/assets/images/home/popular-campaign-1.jpg'),
    title: 'Bkash Branding Campaign',
    price: '$299.99',
    appliedDate: 'Applied 10 July',
  },
  {
    id: 'applied-2',
    image: require('@/assets/images/home/campaign-list-3.jpg'),
    title: 'Bkash Branding Campaign',
    price: '$299.99',
    appliedDate: 'Applied 10 July',
  },
  {
    id: 'applied-3',
    image: require('@/assets/images/home/campaign-list-2.jpg'),
    title: 'Bkash Branding Campaign',
    price: '$299.99',
    appliedDate: 'Applied 10 July',
  },
  {
    id: 'applied-4',
    image: require('@/assets/images/home/popular-campaign-1.jpg'),
    title: 'Bkash Branding Campaign',
    price: '$299.99',
    appliedDate: 'Applied 10 July',
  },
];

// "Request" tab - every card reads "5 min ago" in Figma (node 6475:6394 and
// its 7 card instances), mirrored verbatim. Logos reuse the existing business
// photos already extracted for Home/Businesses (assets/images/home,
// assets/images/businesses) rather than exporting near-duplicate assets:
// KFC/Bkash/Pathao match real existing business entries 1:1; "Grameen" reuses
// businesses/gp.jpg since GP *is* Grameenphone in data/businesses.ts (business-11);
// "Go zayn" has no existing real-business match, so it reuses businesses/robi.jpg
// as a mismatched stand-in, following the same documented precedent as
// data/businesses.ts's own "Bkash Ltd" label on the Bata logo. The 7th card
// keeps Figma's own text/logo mismatch (node 6475:6567's "KFC" copy paired
// with the Pathao logo instance) rather than silently correcting it.
export const campaignRequests: CampaignRequest[] = [
  {
    id: 'request-1',
    businessLogo: require('@/assets/images/home/business-logo-2.jpg'),
    businessName: 'KFC',
    time: '5 min ago',
  },
  {
    id: 'request-2',
    businessLogo: require('@/assets/images/home/business-logo-1.jpg'),
    businessName: 'Bkash',
    time: '5 min ago',
  },
  {
    id: 'request-3',
    businessLogo: require('@/assets/images/home/business-logo-3.jpg'),
    businessName: 'Pathao',
    time: '5 min ago',
  },
  {
    id: 'request-4',
    businessLogo: require('@/assets/images/businesses/robi.jpg'),
    businessName: 'Go zayn',
    time: '5 min ago',
  },
  {
    id: 'request-5',
    businessLogo: require('@/assets/images/businesses/gp.jpg'),
    businessName: 'Grameen',
    time: '5 min ago',
  },
  {
    id: 'request-6',
    businessLogo: require('@/assets/images/home/business-logo-2.jpg'),
    businessName: 'KFC',
    time: '5 min ago',
  },
  {
    id: 'request-7',
    businessLogo: require('@/assets/images/home/business-logo-3.jpg'),
    businessName: 'KFC',
    time: '5 min ago',
  },
];
