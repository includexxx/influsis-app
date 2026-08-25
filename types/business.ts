import { ImageSourcePropType } from 'react-native';

export interface Business {
  id: string;
  source: ImageSourcePropType;
  label: string;
  // Business Details screen fields (scenes/main/BusinessDetails.tsx) - optional
  // since the Businesses grid (scenes/main/Businesses.tsx) only needs source/label.
  name?: string;
  verified?: boolean;
  bannerImage?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  website?: string;
  description?: string;
  campaignIds?: string[];
}
