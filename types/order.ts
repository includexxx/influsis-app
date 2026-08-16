import { ImageSourcePropType } from 'react-native';

// Which of the Order screen's 4 filter tabs (Figma "Order_Campaign", nodes
// 6212:5540/5843/6024 + 6403:5508) an order belongs to. Kept as an explicit
// field on `Order` rather than 4 separate arrays (like
// types/application.ts's `AppliedCampaign`/`CampaignRequest` split) since
// every tab renders the exact same card shape here - only the filter
// changes, not the data shape.
export type OrderTab = 'campaign' | 'gig-order' | 'completed' | 'cancelled';

// A single deliverable line on the Order Details screen's "Deliverable"
// card (Figma node 6040:8515) - structurally the same shape as
// `CampaignDeliverable` (types/campaign.ts) but kept as its own type since
// the two screens' deliverable lists aren't the same data.
export interface OrderDeliverable {
  title: string;
  description: string;
}

// A single order row on the Order screen (scenes/main/Order.tsx) and, when
// its detail fields are set, the Order Details screen it's tapped into
// (scenes/main/OrderDetails.tsx). Distinct from `Campaign`
// (types/campaign.ts) and `AppliedCampaign` (types/application.ts) - this
// shows who the order was placed with and its due/ordered dates, not
// campaign-detail fields like tags.
export interface Order {
  id: string;
  tab: OrderTab;
  image: ImageSourcePropType;
  title: string;
  orderedFrom: string;
  price: string;
  status: string;
  statusColor: string;
  statusTextColor: string;
  // Present on the "Gig order" / "Completed" / "Cancelled" tabs' cards
  // (Figma nodes 6212:6186 etc.), absent on the "Campaign" tab's shorter
  // card (node 6212:6496) - OrderCard shows its divider + footer row only
  // when both are set.
  dueDate?: string;
  orderedDate?: string;
  // Order Details screen fields (Figma node 6040:8515) - optional since
  // OrderCard/the Order list don't need them, the same reasoning
  // `Campaign`'s own detail-only fields document.
  brandName?: string;
  brandVerified?: boolean;
  deliveryDate?: string;
  deliverables?: OrderDeliverable[];
  requirements?: string[];
}
