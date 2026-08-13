import { ImageSourcePropType } from 'react-native';

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
}
