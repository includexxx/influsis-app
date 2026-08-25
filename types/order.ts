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

// A single row on the Order Deliver screen's "Order Activity" timeline
// (Figma node 6040:8590). `icon` names which of the two extracted glyphs to
// show - kept as a narrow key rather than an `ImageSourcePropType` here so
// `data/orders.ts` doesn't need to `require()` image assets just to
// describe timeline content; `scenes/main/OrderDeliver.tsx` resolves it to
// the actual asset. `muted` reproduces Figma's own 3rd timeline item, whose
// action text is a lighter `rgba(0,0,0,0.7)` than the other two.
export interface OrderActivityEvent {
  icon: 'place-order' | 'order-started';
  action: string;
  timestamp: string;
  muted?: boolean;
}

// A single step on the Order Deliver screen's "Order Details" tab's "Order
// Tracker" card (Figma node 6040:8664). `completed` steps get a filled pink
// circle + checkmark and a pink connector line down to the next step;
// incomplete steps get a black circle + white dot and a gray connector.
export interface OrderTrackerStep {
  title: string;
  description: string;
  completed?: boolean;
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
  businessName?: string;
  businessVerified?: boolean;
  deliveryDate?: string;
  deliverables?: OrderDeliverable[];
  requirements?: string[];
  // Order Deliver screen fields (Figma node 6040:8590) - optional for the
  // same reason as the Order Details fields above.
  activity?: OrderActivityEvent[];
  // Order Deliver screen's in-place "Order Details" tab fields (Figma node
  // 6040:8664) - `businessName`/`deliveryDate`/`title`/`price`/`status` are
  // reused from the fields above rather than duplicated (Figma's own
  // "Purchased by"/"Delivery due date" values are shown identically there).
  orderNumber?: string;
  tracker?: OrderTrackerStep[];
}
