import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  icon: ImageSourcePropType;
  starSize?: number;
  label?: string;
  /** Read as one label (e.g. "4.5 out of 5 stars") instead of the icons. */
  accessibilityLabel?: string;
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
  halfClip: {
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
});

// Row of filled star icons + an optional trailing label - two shapes on the
// Creator Profile screen share this: the header's single-star "4.5"
// rating (Figma node 6001:37880, `maxStars={1}`) and each review's
// five-star "(5/5)" row (node 6001:37892, `maxStars={5}`). Reviews are rated
// in half steps (backend 23), so `rating` rounds to the nearest 0.5: whole
// stars, then one half star (the icon clipped to half its width) when a half
// remains and there's room under `maxStars`. Empty stars aren't drawn.
function StarRating({
  rating,
  maxStars = 5,
  icon,
  starSize = 24,
  label,
  accessibilityLabel,
  style,
  testID,
}: StarRatingProps) {
  const { colors } = useTheme();
  const halves = Math.max(0, Math.round(rating * 2));
  const full = Math.min(maxStars, Math.floor(halves / 2));
  const hasHalf = halves % 2 === 1 && full < maxStars;
  const starStyle = { width: starSize, height: starSize };

  return (
    <View
      style={[styles.root, style]}
      accessible={accessibilityLabel ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      <View style={styles.starRow}>
        {Array.from({ length: full }).map((_, index) => (
          <Image
            key={index}
            source={icon}
            style={starStyle}
            contentFit="contain"
            testID="star-full"
          />
        ))}
        {hasHalf ? (
          <View style={[styles.halfClip, { width: starSize / 2, height: starSize }]}>
            <Image source={icon} style={starStyle} contentFit="contain" testID="star-half" />
          </View>
        ) : null}
      </View>
      {!!label && <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>}
    </View>
  );
}

export default StarRating;
