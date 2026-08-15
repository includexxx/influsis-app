import { Gig, GigService } from './gigs.types';

// Canonical gig list - the single source of truth for every screen that
// shows gigs (Home's "Top Gigs" row via data/home.ts, the full list at
// data/topGigs.ts, and the Gig Details screen at scenes/main/GigDetails.tsx,
// which looks a gig up here by the `id` in its `/gig/[id]` route param).
// Consolidated into one shared list - rather than the two separate,
// non-overlapping id namespaces Home and Top Gigs each had before Gig
// Details needed a real per-gig lookup - so tapping any gig card anywhere
// in the app resolves to the same record. Standing in for a real gigs API
// - see docs/screen/gig-details/README.md "Scope notes" and docs/PRD.md
// §2.2/§4.1 (no backend exists yet).

// Figma's Gig Details screen (node 6401:5746 and siblings) shows one
// example "What I will create" breakdown - mirrored identically across
// every gig below rather than inventing distinct service lists Figma
// doesn't specify, same as this project's other mock data.
const services: GigService[] = [
  {
    title: 'Instagram Post',
    description: '1 carousel post (3-5 images) featuring the products',
  },
  {
    title: 'Facebook Post',
    description: '1 carousel post (3-5 images) featuring the products',
  },
  {
    title: 'You tube Post',
    description: '1 carousel post (3-5 images) featuring the products',
  },
];

// Figma's own "Description of this Gig" repeats its second bullet
// verbatim as a third - mirrored as-is (see docs/screen/gig-details).
const descriptionBullets: string[] = [
  'I believe every brand has a story and I love narrating one with my unique statement.',
  'Let me know your requirement and brief about your product and I will create the best UGC content to promote it.',
  'Let me know your requirement and brief about your product and I will create the best UGC content to promote it.',
];

export const gigs: Gig[] = [
  {
    id: 'gig-1',
    image: require('@/assets/images/home/gig-1.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
    services,
    descriptionBullets,
  },
  {
    id: 'gig-2',
    image: require('@/assets/images/gigs/ribbon.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
    services,
    descriptionBullets,
  },
  {
    id: 'gig-3',
    image: require('@/assets/images/home/gig-2.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
    services,
    descriptionBullets,
  },
  {
    id: 'gig-4',
    image: require('@/assets/images/gigs/nature.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
    services,
    descriptionBullets,
  },
  {
    id: 'gig-5',
    image: require('@/assets/images/gigs/paper-leaves.jpg'),
    platforms: 'TikTok, Facebook, Youtube',
    price: '$350',
    description: 'I will create facebook promotion, youtube, tiktok promotion',
    services,
    descriptionBullets,
  },
];
