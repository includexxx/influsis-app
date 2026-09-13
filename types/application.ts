import { ImageSourcePropType } from 'react-native';

// A campaign the creator has already applied to (Applications screen's
// "Applied" tab, scenes/main/Applications.tsx) - distinct from `Campaign`
// (types/campaign.ts) since this list only ever needs a photo, title, price
// and the application date, not the full campaign-detail field set.
export interface AppliedCampaign {
  id: string;
  image: ImageSourcePropType;
  title: string;
  price: string;
  appliedDate: string;
}

// A brand's invitation to join a campaign (Applications screen's "Request"
// tab) - accept/decline, no further detail fields specified by Figma.
export interface CampaignRequest {
  id: string;
  brandLogo: ImageSourcePropType;
  brandName: string;
  time: string;
}
