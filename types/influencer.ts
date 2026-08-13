import { ImageSourcePropType } from 'react-native';

export interface Review {
  id: string;
  avatar: ImageSourcePropType;
  name: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

export interface Influencer {
  id: string;
  image: ImageSourcePropType;
  name: string;
  verified?: boolean;
  topRated?: boolean;
  location: string;
  tags?: string[];
  followers: string;
  engagement: string;
  // Influencer Profile screen fields (scenes/main/InfluencerProfile.tsx) -
  // optional since the list/card views (InfluencerCard, Home's avatar row)
  // don't need them.
  bannerImage?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  bio?: string;
  categories?: string[];
  customerRating?: number;
  activeGigIds?: string[];
  reviews?: Review[];
}
