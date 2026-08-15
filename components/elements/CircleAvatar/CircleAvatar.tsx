import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface CircleAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  withLabel: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.08,
    textAlign: 'center',
    fontWeight: '700',
  },
});

// Plain circular photo used by the Home screen's "Brand" logo row and "Top
// Rated Influencer" avatar row (Figma nodes 6770:6071 / 6121:6533) - both
// are the same 80px circle shape, just with different source images. The
// optional `label` (a name centered below the circle, Figma node
// 6010:16915) was added for the Brands screen's grid (docs/screen/brands),
// and `onPress` (Figma's Influencer Profile screen, docs/screen/
// influencer-profile) for Home's avatar row linking through to a profile -
// omitting both keeps the original call sites' plain-circle rendering (and
// root element) unchanged.
function CircleAvatar({ source, size = 80, label, onPress, style, testID }: CircleAvatarProps) {
  const { colors } = useTheme();

  const avatar = (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
      testID={onPress ? undefined : testID}
    />
  );

  const content = !label ? (
    avatar
  ) : (
    <View style={[styles.withLabel, { width: size }]}>
      {avatar}
      <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID}>
      {content}
    </Pressable>
  );
}

export default CircleAvatar;
