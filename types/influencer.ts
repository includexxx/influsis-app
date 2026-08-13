import { ImageSourcePropType } from 'react-native';

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
}
