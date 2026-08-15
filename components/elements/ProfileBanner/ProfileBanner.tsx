import { View, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import Image from '../Image';

export interface ProfileBannerProps {
  bannerImage: ImageSourcePropType;
  avatarImage?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  wrap: {
    height: 205,
  },
  banner: {
    width: '100%',
    height: 173,
  },
  avatar: {
    position: 'absolute',
    left: 16,
    top: 143,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});

// Full-bleed banner photo with a circular avatar overlapping its bottom-left
// corner (173px banner, 62px avatar overlapping by 30px, composite height
// 173+(62-30)=205) - the Brand Details / Campaign Details composite (Figma
// nodes 6001:37744+37750+37751 / 6001:37666+37672+37673), byte-identical
// between the two screens since Figma reuses the same banner/avatar photo
// pair. Not used by Influencer Profile, which has a different (rounded-
// square, 78px) avatar shape - see styles/influencerProfile.ts; forcing a
// 3rd shape through this component's props would trade a small style
// duplication for a harder-to-read shared component.
function ProfileBanner({ bannerImage, avatarImage, style, testID }: ProfileBannerProps) {
  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <Image source={bannerImage} style={styles.banner} contentFit="cover" />
      {avatarImage && <Image source={avatarImage} style={styles.avatar} contentFit="cover" />}
    </View>
  );
}

export default ProfileBanner;
