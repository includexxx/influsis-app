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
import { getBusinessInitial } from '../utils/businessAvatar';

export interface BusinessAvatarProps {
  source: ImageSourcePropType | null;
  businessName: string;
  label?: string;
  size?: number;
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
  },
  initial: {
    fontWeight: '600',
  },
});

// A business's circular logo, falling back to an initial-letter circle when
// `avatarUrl` is null - there's no generic "no logo" illustration asset in
// this project (see scenes/business/utils/businessAvatar.ts). Wraps the
// shared CircleAvatar rather than replacing it, so the "has a real photo"
// case looks identical everywhere CircleAvatar already renders a business.
function BusinessAvatar({
  source,
  businessName,
  label,
  size = 80,
  onPress,
  style,
  testID,
}: BusinessAvatarProps) {
  const { colors, palette } = useTheme();

  if (source) {
    return (
      <CircleAvatar
        source={source}
        label={label}
        size={size}
        onPress={onPress}
        style={style}
        testID={testID}
      />
    );
  }

  const fallback = (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.gray[50] },
        { alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      testID={onPress ? undefined : testID}>
      <Text style={[styles.initial, { fontSize: size * 0.4, color: palette.gray[400] }]}>
        {getBusinessInitial(businessName)}
      </Text>
    </View>
  );

  const content = !label ? (
    fallback
  ) : (
    <View style={[styles.withLabel, { width: size }]}>
      {fallback}
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

export default BusinessAvatar;
