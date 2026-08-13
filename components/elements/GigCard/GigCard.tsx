import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface GigCardProps {
  image: ImageSourcePropType;
  platforms: string;
  price: string;
  description: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    width: 356,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  image: {
    width: '100%',
    height: 134,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platforms: {
    fontSize: 10,
    lineHeight: 15,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});

// Gig card for the Home screen's "Top Gigs" row (Figma node 6770:6071's
// sibling gig cards, e.g. 6121:6617).
function GigCard({ image, platforms, price, description, onPress, style, testID }: GigCardProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, { borderColor: palette.gray[50] }, style]}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.platforms, { color: palette.gray[400] }]}>{platforms}</Text>
          <Text style={[styles.price, { color: colors.text.primary }]}>{price}</Text>
        </View>
        <Text style={[styles.description, { color: colors.text.primary }]} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export default GigCard;
