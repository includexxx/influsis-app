import { ImageSourcePropType } from 'react-native';

export interface GigService {
  title: string;
  description: string;
}

export interface Gig {
  id: string;
  image: ImageSourcePropType;
  platforms: string;
  price: string;
  description: string;
  services?: GigService[];
  descriptionBullets?: string[];
}
