import { ImageSourcePropType } from 'react-native';

export interface Brand {
  id: string;
  source: ImageSourcePropType;
  label: string;
  // Brand Details screen fields (scenes/main/BrandDetails.tsx) - optional
  // since the Brands grid (scenes/main/Brands.tsx) only needs source/label.
  name?: string;
  verified?: boolean;
  bannerImage?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  website?: string;
  description?: string;
  campaignIds?: string[];
}
