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
import { palette } from '@/theme';
import Image from '../Image';

const editIcon = require('@/assets/images/create-gig/edit-icon.png');

export interface CircleAvatarProps {
  source: ImageSourcePropType;
  size?: number;
  label?: string;
  onPress?: () => void;
  onEditPress?: () => void;
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
  editWrap: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: palette.primary[400],
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
// root element) unchanged. `onEditPress` (Figma "Type=Edit, Component=
// Avatar", node 6001:39057) adds the small pink pencil badge overlapping
// the circle's bottom-right corner, sized proportionally to `size` (30px on
// Figma's 120px avatar) rather than a fixed value, for the Edit Profile
// screen's photo picker (docs/screen/profile).
function CircleAvatar({
  source,
  size = 80,
  label,
  onPress,
  onEditPress,
  style,
  testID,
}: CircleAvatarProps) {
  const { colors } = useTheme();
  const badgeSize = size * 0.25;

  const avatarImage = (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
      testID={onPress || onEditPress ? undefined : testID}
    />
  );

  const avatar = !onEditPress ? (
    avatarImage
  ) : (
    <View style={styles.editWrap}>
      {avatarImage}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change photo"
        hitSlop={8}
        onPress={onEditPress}
        testID={testID}
        style={[
          styles.editBadge,
          { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 },
        ]}>
        <Image
          source={editIcon}
          style={{ width: badgeSize * 0.5, height: badgeSize * 0.5, tintColor: '#FFFFFF' }}
          contentFit="contain"
        />
      </Pressable>
    </View>
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
