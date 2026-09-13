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

const verifiedCheckIcon = require('@/assets/images/creators/verified-check.png');
const starIcon = require('@/assets/images/creators/star.png');
const locationPinIcon = require('@/assets/images/creators/location-pin.png');

export interface CreatorCardProps {
  image: ImageSourcePropType;
  name: string;
  verified?: boolean;
  topRated?: boolean;
  location: string;
  tags?: string[];
  followers: string;
  engagement: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 148,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  verifiedIcon: {
    width: 13,
    height: 12.5,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FEF7E4',
  },
  topRatedIcon: {
    width: 16,
    height: 16,
  },
  topRatedLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#FFB800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  locationIcon: {
    width: 20,
    height: 20,
  },
  location: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 23,
    marginTop: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 5,
    flexShrink: 1,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#F4F4F4',
  },
  tagLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: '#4A4C56',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statColumn: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});

// Creator profile card for the Top Creators screen (Figma node
// 6028:7512 and siblings) - photo, name + verified badge, an amber
// "Top Rated" pill, location, a row of tag pills, and a followers/
// engagement stat pair. A new component (not an extension of GigCard or
// CampaignCard) since its content model - social stats, tags, a rating
// badge - doesn't overlap either. See docs/screen/top-creators.
function CreatorCard({
  image,
  name,
  verified,
  topRated,
  location,
  tags,
  followers,
  engagement,
  onPress,
  style,
  testID,
}: CreatorCardProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, { borderColor: palette.gray[50], backgroundColor: colors.card }, style]}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <View style={styles.nameGroup}>
            <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
              {name}
            </Text>
            {verified && (
              <Image source={verifiedCheckIcon} style={styles.verifiedIcon} contentFit="contain" />
            )}
          </View>
          {topRated && (
            <View style={styles.topRatedBadge}>
              <Image source={starIcon} style={styles.topRatedIcon} contentFit="contain" />
              <Text style={styles.topRatedLabel}>Top Rated</Text>
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Image source={locationPinIcon} style={styles.locationIcon} contentFit="contain" />
          <Text style={[styles.location, { color: palette.gray[300] }]}>{location}</Text>
        </View>

        <View style={styles.bottomRow}>
          {!!tags?.length && (
            <View style={styles.tagRow}>
              {tags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.tagPill}>
                  <Text style={styles.tagLabel}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{followers}</Text>
              <Text style={[styles.statLabel, { color: palette.gray[300] }]}>Followers</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{engagement}</Text>
              <Text style={[styles.statLabel, { color: palette.gray[300] }]}>Engagement</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default CreatorCard;
