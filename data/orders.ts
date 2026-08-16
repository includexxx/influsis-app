import { palette } from '@/theme';
import { Order } from '@/types';

// Mock content for the Order screen (scenes/main/Order.tsx, Figma
// "Order_Campaign" - nodes 6212:5540 "Campaign" tab, 6212:5843 "Gig order"
// tab, 6212:6024 "Completed" tab, 6403:5508 "Cancelled" tab) - standing in
// for a real orders API, same as every other screen (see docs/PRD.md
// §2.2/§4.1). Reuses photos already extracted for Home rather than
// exporting duplicates of Figma's stock thumbnails - see
// docs/screen/orders/README.md "Scope notes" for which Home asset each
// card's Figma photo most closely matches.
//
// Every card within a tab repeats the same title/subtitle/price in Figma
// (only the photo differs across cards, and even that repeats) - mirrored
// here rather than inventing distinct content Figma doesn't specify, the
// same convention data/campaigns.ts and data/applications.ts follow.
//
// The "Campaign" tab's 7th card (node 6212:6646) uses a green "In Progress"
// badge in Figma while every other "In Progress" card on this screen uses
// the orange/warning pairing - normalized to the consistent orange pairing
// here as a one-off Figma inconsistency (the label reads "In Progress" on
// all 7 cards; only that one card's color was swapped).
const campaignImages = [
  require('@/assets/images/home/campaign-list-1.jpg'),
  require('@/assets/images/home/campaign-list-2.jpg'),
  require('@/assets/images/home/campaign-list-3.jpg'),
  require('@/assets/images/home/campaign-list-4.jpg'),
  require('@/assets/images/home/popular-campaign-1.jpg'),
  require('@/assets/images/home/popular-campaign-2.jpg'),
  require('@/assets/images/home/popular-campaign-3.jpg'),
];

const gigImages = [
  require('@/assets/images/home/gig-1.jpg'),
  require('@/assets/images/home/gig-2.jpg'),
];

const inProgressBadge = {
  status: 'In Progress',
  statusColor: palette.warning[100],
  statusTextColor: palette.warning[500],
};

const completedBadge = {
  status: 'Completed',
  statusColor: palette.secondary[50],
  statusTextColor: palette.secondary[400],
};

const cancelledBadge = {
  status: 'Cancelled',
  statusColor: palette.primary[50],
  statusTextColor: palette.primary[400],
};

// Order Details screen fields (scenes/main/OrderDetails.tsx, Figma node
// 6040:8515) - shows a single example order (a verified brand, a delivery
// date, 3 deliverables, 3 requirements) applied identically to every order
// below rather than inventing distinct detail content Figma doesn't
// specify, same convention data/campaigns.ts's own `detailFields` follows.
// Figma's 3 deliverable items are themselves identical copies ("Instagram
// Post" / "1 carousel post (3-5 images) featuring the products" x3) -
// mirrored verbatim rather than assumed to be a paste error, since unlike
// data/campaigns.ts's corrupted "About the brand" paragraph these three
// read as plausible (if repetitive) real content, not garbled text.
const detailFields = {
  deliveryDate: 'Apr 24, 2025',
  deliverables: [
    {
      title: 'Instagram Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
    {
      title: 'Instagram Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
    {
      title: 'Instagram Post',
      description: '1 carousel post (3-5 images) featuring the products',
    },
  ],
  requirements: [
    '10,000+ Instagram followers',
    'Fashion/Lifestyle content focus',
    'High engagement rate (>2%)',
  ],
};

// "Campaign" tab (node 6212:5540) - shorter card, no due/ordered-date
// footer (OrderCard omits its divider + footer row when `dueDate`/
// `orderedDate` are unset).
export const campaignOrders: Order[] = campaignImages.map((image, index) => ({
  id: `order-campaign-${index + 1}`,
  tab: 'campaign',
  image,
  title: 'Social Media Management',
  orderedFrom: 'Ordered from Bkash',
  price: '$130',
  ...inProgressBadge,
  brandName: 'Bkash Ltd.',
  brandVerified: true,
  ...detailFields,
}));

// "Gig order" tab (node 6212:5843) - taller card with a divider + due/
// ordered-date footer row.
export const gigOrders: Order[] = Array.from({ length: 5 }, (_, index) => ({
  id: `order-gig-${index + 1}`,
  tab: 'gig-order',
  image: gigImages[index % gigImages.length],
  title: 'Social Media Management',
  orderedFrom: 'Ordered from Jhon Smith',
  price: '$130',
  dueDate: 'Due in 12 days',
  orderedDate: 'Ordered Feb 12, 2025',
  ...inProgressBadge,
  brandName: 'Jhon Smith',
  brandVerified: true,
  ...detailFields,
}));

// "Completed" tab (node 6212:6024) - same card shape as "Gig order", green
// status pairing.
export const completedOrders: Order[] = Array.from({ length: 5 }, (_, index) => ({
  id: `order-completed-${index + 1}`,
  tab: 'completed',
  image: gigImages[index % gigImages.length],
  title: 'Social Media Management',
  orderedFrom: 'Ordered from Jhon Smith',
  price: '$130',
  dueDate: 'Due in 12 days',
  orderedDate: 'Ordered Feb 12, 2025',
  ...completedBadge,
  brandName: 'Jhon Smith',
  brandVerified: true,
  ...detailFields,
}));

// "Cancelled" tab (node 6403:5508) - same card shape again, pink status
// pairing.
export const cancelledOrders: Order[] = Array.from({ length: 5 }, (_, index) => ({
  id: `order-cancelled-${index + 1}`,
  tab: 'cancelled',
  image: gigImages[index % gigImages.length],
  title: 'Social Media Management',
  orderedFrom: 'Ordered from Jhon Smith',
  price: '$130',
  dueDate: 'Due in 12 days',
  orderedDate: 'Ordered Feb 12, 2025',
  ...cancelledBadge,
  brandName: 'Jhon Smith',
  brandVerified: true,
  ...detailFields,
}));

// Single flat array, filtered client-side by `tab` in the scene - the more
// idiomatic shape for a 4-way filter than 4 separately-exported arrays,
// since the card shape is identical across tabs (only `Order['tab']`
// differs).
export const orders: Order[] = [
  ...campaignOrders,
  ...gigOrders,
  ...completedOrders,
  ...cancelledOrders,
];
