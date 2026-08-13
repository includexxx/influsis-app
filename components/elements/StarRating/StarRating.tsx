import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  icon: ImageSourcePropType;
  starSize?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
});

// Row of filled star icons + an optional trailing label - two shapes on the
// Influencer Profile screen share this: the header's single-star "4.5"
// rating (Figma node 6001:37880, `maxStars={1}`) and each review's
// five-star "(5/5)" row (node 6001:37892, `maxStars={5}`). Figma doesn't
// show a partial/half-filled star for any rating shown, so `rating` only
// controls how many whole stars render (`Math.round`), not partial fill.
function StarRating({
  rating,
  maxStars = 5,
  icon,
  starSize = 24,
  label,
  style,
  testID,
}: StarRatingProps) {
  const { colors } = useTheme();
  const filled = Math.max(0, Math.min(maxStars, Math.round(rating)));

  return (
    <View style={[styles.root, style]} testID={testID}>
      <View style={styles.starRow}>
        {Array.from({ length: filled }).map((_, index) => (
          <Image
            key={index}
            source={icon}
            style={{ width: starSize, height: starSize }}
            contentFit="contain"
          />
        ))}
      </View>
      {!!label && <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>}
    </View>
  );
}

export default StarRating;
