import { Creator, Review } from '@/types';

// Canonical creator list - the single source of truth for every screen
// that shows creators (Home's "Top Rated Creator" row via
// data/home.ts, the full list at data/topCreators.ts, and the
// Creator Profile screen at scenes/main/CreatorProfile.tsx, which
// looks an creator up here by the `id` in its `/creator/[id]` route
// param). Consolidated into one shared list - rather than Home's avatar
// row using a separate, identity-less set of five circular headshots
// (`creator-1..5.jpg`) that didn't correspond to any of these four named
// creators - so tapping any avatar anywhere in the app resolves to a
// real, matching profile. Standing in for a real creators API - see
// docs/screen/creator-profile/README.md "Scope notes" and
// docs/PRD.md §2.2/§4.1 (no backend exists yet).

// Figma's Creator Profile screen (node 6001:37822) shows one example
// bio/category/rating/review set - mirrored identically across all four
// creators below rather than inventing distinct profile content Figma
// doesn't specify, same as this project's other mock data (e.g. Gig
// Details' "What I will create" breakdown).
const bio =
  'Beauty and lifestyle content creator with 5+ years of experience. Specializing in authentic, engaging content that resonates with young audiences. Featured by major beauty businesses and magazines.';

const categories = ['Entertainment', 'Lifestyle', 'Sports'];

// Figma repeats the same reviewer ("Salman Muktadir"), rating, timestamp
// and comment across all three review cards - mirrored as-is.
const reviews: Review[] = [
  {
    id: 'review-1',
    avatar: require('@/assets/images/profile/reviewer-avatar.jpg'),
    name: 'Salman Muktadir',
    rating: 5,
    timeAgo: 'about 1 hour ago',
    comment:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our sustainable fashion campaign, creating visually captivating content that conveyed our message effectively.',
  },
  {
    id: 'review-2',
    avatar: require('@/assets/images/profile/reviewer-avatar.jpg'),
    name: 'Salman Muktadir',
    rating: 5,
    timeAgo: 'about 1 hour ago',
    comment:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our sustainable fashion campaign, creating visually captivating content that conveyed our message effectively.',
  },
  {
    id: 'review-3',
    avatar: require('@/assets/images/profile/reviewer-avatar.jpg'),
    name: 'Salman Muktadir',
    rating: 5,
    timeAgo: 'about 1 hour ago',
    comment:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our sustainable fashion campaign, creating visually captivating content that conveyed our message effectively.',
  },
];

// Figma's "Active Gigs" section shows a gig card identical to the existing
// GigCard content (same photo as data/gigs.ts's "gig-1") - referencing real
// ids from that canonical list rather than inventing separate gig content
// here, so these cards stay tappable through to a real /gig/[id] the same
// way every other GigCard in the app is.
const activeGigIds = ['gig-1', 'gig-2'];

export const creators: Creator[] = [
  {
    id: 'creator-1',
    image: require('@/assets/images/creators/sunehra-tasnim.jpg'),
    name: 'Sunehra tasnim',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
    bannerImage: require('@/assets/images/profile/banner.jpg'),
    avatar: require('@/assets/images/profile/avatar.jpg'),
    bio,
    categories,
    customerRating: 4.5,
    activeGigIds,
    reviews,
  },
  {
    id: 'creator-2',
    image: require('@/assets/images/creators/salman-muqtadir-1.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
    bannerImage: require('@/assets/images/profile/banner.jpg'),
    avatar: require('@/assets/images/profile/avatar.jpg'),
    bio,
    categories,
    customerRating: 4.5,
    activeGigIds,
    reviews,
  },
  {
    id: 'creator-3',
    image: require('@/assets/images/creators/salman-muqtadir-2.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
    bannerImage: require('@/assets/images/profile/banner.jpg'),
    avatar: require('@/assets/images/profile/avatar.jpg'),
    bio,
    categories,
    customerRating: 4.5,
    activeGigIds,
    reviews,
  },
  {
    id: 'creator-4',
    image: require('@/assets/images/creators/creator-4.jpg'),
    name: 'Salman Muqtadir',
    verified: true,
    topRated: true,
    location: 'Dhaka, Bangladesh',
    tags: ['Dhaka, Bangladesh', 'Dhaka, Bangladesh'],
    followers: '2.5M',
    engagement: '4.8%',
    bannerImage: require('@/assets/images/profile/banner.jpg'),
    avatar: require('@/assets/images/profile/avatar.jpg'),
    bio,
    categories,
    customerRating: 4.5,
    activeGigIds,
    reviews,
  },
];
