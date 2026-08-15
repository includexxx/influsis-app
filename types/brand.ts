import { ImageSourcePropType } from 'react-native';
import { DetailProfileFields } from './detailProfile';

export interface Brand extends DetailProfileFields {
  id: string;
  source: ImageSourcePropType;
  label: string;
  // Brand Details screen fields (scenes/main/BrandDetails.tsx) - optional
  // since the Brands grid (scenes/main/Brands.tsx) only needs source/label.
  name?: string;
  website?: string;
  description?: string;
  campaignIds?: string[];
}
