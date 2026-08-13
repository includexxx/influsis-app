import { Campaign } from '@/types';

// Mock content for the Live Campaigns screen (scenes/main/LiveCampaign.tsx),
// standing in for a real campaigns API - see
// docs/screen/live-campaign/README.md "Scope notes" and docs/PRD.md §2.2/§4.1
// (no backend exists yet). Reuses the campaign photos already extracted for
// Home (assets/images/home) rather than exporting duplicates.
//
// Figma repeats "Bkash Branding Campaign" / "Bkash Ltd." across seven of the
// eight cards (node 6111:6952/6974/6996/7018/7039/7061/6875), with the
// second card alone using the longer "Summer Unisex T-Shirt Fashion
// Collection Campaigns" title (node 6111:6932) - mirrored here rather than
// inventing distinct campaign names Figma doesn't specify, same as
// data/home.ts and data/search.ts.
export const liveCampaigns: Campaign[] = [
  {
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
