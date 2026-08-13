import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface CircleAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  label?: string;
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
  },
});

// Plain circular photo used by the Home screen's "Brand" logo row and "Top
// Rated Influencer" avatar row (Figma nodes 6770:6071 / 6121:6533) - both
// are the same 80px circle shape, just with different source images. The
// optional `label` (a name centered below the circle, Figma node
// 6010:16915) was added for the Brands screen's grid (docs/screen/brands) -
// omitting it keeps every existing call site's plain-circle rendering
// (and root element) unchanged.
function CircleAvatar({ source, size = 80, label, style, testID }: CircleAvatarProps) {
  const { colors } = useTheme();

  const avatar = (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
      testID={testID}
    />
  );

  if (!label) {
    return avatar;
  }

  return (
    <View style={[styles.withLabel, { width: size }]}>
      {avatar}
      <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default CircleAvatar;
