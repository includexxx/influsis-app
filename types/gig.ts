import { ImageSourcePropType } from 'react-native';

export interface Gig {
  id: string;
  image: ImageSourcePropType;
  platforms: string;
  price: string;
  description: string;
}
