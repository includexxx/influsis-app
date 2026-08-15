import { ImageSourcePropType } from 'react-native';
import { DetailProfileFields } from './detailProfile';

export interface Review {
  id: string;
  avatar: ImageSourcePropType;
  name: string;
  rating: number;
  timeAgo: string;
  comment: string;
}

export interface Influencer extends DetailProfileFields {
  id: string;
  image: ImageSourcePropType;
  name: string;
  topRated?: boolean;
  location: string;
  tags?: string[];
  followers: string;
  engagement: string;
  // Influencer Profile screen fields (scenes/main/InfluencerProfile.tsx) -
  // optional since the list/card views (InfluencerCard, Home's avatar row)
  // don't need them.
  bio?: string;
  categories?: string[];
  customerRating?: number;
  activeGigIds?: string[];
  reviews?: Review[];
}
