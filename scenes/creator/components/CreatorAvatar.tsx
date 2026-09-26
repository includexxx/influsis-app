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
import CircleAvatar from '@/components/elements/CircleAvatar';
import { getCreatorInitial } from '../utils/creatorLocation';

export interface CreatorAvatarProps {
  source: ImageSourcePropType | null;
  displayName: string;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '600',
  },
});

// A creator's circular avatar, falling back to an initial-letter circle when
// `avatarUrl` is null - there's no generic "no photo" illustration asset in
// this project (same reasoning as scenes/business/components/BusinessAvatar.tsx).
function CreatorAvatar({
  source,
  displayName,
  size = 80,
  onPress,
  style,
  testID,
}: CreatorAvatarProps) {
  const { palette } = useTheme();

  if (source) {
    return (
      <CircleAvatar source={source} size={size} onPress={onPress} style={style} testID={testID} />
    );
  }

  const fallback = (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.gray[50] },
        styles.fallback,
        style,
      ]}
      testID={onPress ? undefined : testID}>
      <Text style={[styles.initial, { fontSize: size * 0.4, color: palette.gray[400] }]}>
        {getCreatorInitial(displayName)}
      </Text>
    </View>
  );

  if (!onPress) {
    return fallback;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID}>
      {fallback}
    </Pressable>
  );
}

export default CreatorAvatar;
