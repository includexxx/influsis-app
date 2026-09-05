import { ImageSourcePropType } from 'react-native';

export interface CampaignDeliverable {
  title: string;
  description: string;
}

export interface Campaign {
  id: string;
  image: ImageSourcePropType;
  title: string;
  price: string;
  dueDate: string;
  tags?: string[];
  verified?: boolean;
  brandAvatar?: ImageSourcePropType;
  brandName?: string;
  servicesDescription?: string;
  status?: string;
  // Campaign Details screen fields (scenes/main/CampaignDetails.tsx) -
  // optional since card views (CampaignCard) don't need them.
  bannerImage?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  budget?: string;
  duration?: string;
  followerWanted?: string;
  about?: string;
  requirements?: string[];
  deliverables?: CampaignDeliverable[];
  brandDescription?: string;
  website?: string;
  applicationDeadline?: string;
}
