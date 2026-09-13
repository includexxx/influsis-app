import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';
import StarRating from '../StarRating';

const starIcon = require('@/assets/images/profile/star-rating.png');

export interface ReviewCardProps {
  avatar: ImageSourcePropType;
  name: string;
  rating: number;
  timeAgo: string;
  comment: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  nameColumn: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 14,
    lineHeight: 21,
  },
  comment: {
    fontSize: 16,
    lineHeight: 24,
  },
});

// Customer review card (Figma "Frame 1618873242" and siblings, node
// 6001:37885, on the Creator Profile screen) - reviewer avatar, name,
// a five-star rating row, a relative timestamp, and the review text.
function ReviewCard({ avatar, name, rating, timeAgo, comment, style, testID }: ReviewCardProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[styles.root, { borderColor: palette.gray[50], backgroundColor: colors.card }, style]}
      testID={testID}>
      <View style={styles.topRow}>
        <Image source={avatar} style={styles.avatar} contentFit="cover" />
        <View style={styles.nameColumn}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.timeAgo, { color: palette.gray[300] }]}>{timeAgo}</Text>
          </View>
          <StarRating
            rating={rating}
            maxStars={5}
            icon={starIcon}
            starSize={24}
            label={`(${rating}/5)`}
          />
        </View>
      </View>
      <Text style={[styles.comment, { color: colors.text.primary }]}>{comment}</Text>
    </View>
  );
}

export default ReviewCard;
