import { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import Image from '../Image';

export interface CircleAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

// Plain circular photo used by the Home screen's "Brand" logo row and "Top
// Rated Influencer" avatar row (Figma nodes 6770:6071 / 6121:6533) - both
// are the same 80px circle shape, just with different source images.
function CircleAvatar({ source, size = 80, style, testID }: CircleAvatarProps) {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
      testID={testID}
    />
  );
}

export default CircleAvatar;
