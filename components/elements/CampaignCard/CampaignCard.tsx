import {
  Platform,
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
import CalendarBadge from '../CalendarBadge';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');

export type CampaignCardVariant = 'hero' | 'list';

export interface CampaignCardProps {
  variant?: CampaignCardVariant;
  image: ImageSourcePropType;
  brandAvatar?: ImageSourcePropType;
  brandName?: string;
  title: string;
  verified?: boolean;
  tags?: string[];
  servicesDescription?: string;
  price: string;
  dueDate: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Figma's `0px 2px 15.5px rgba(0,0,0,0.1)` list-card shadow, platform-
// branched the same way theme/shadows.ts's `getShadowStyle` and
// app/(main)/_layout.tsx's `tabBarShadow` are - raw `shadow*` style props
// are deprecated on React Native Web in favor of `boxShadow`.
const listShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 2px 15.5px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15.5,
        elevation: 4,
      };

const styles = StyleSheet.create({
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
    ...listShadow,
  },
  imageWrap: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 139,
  },
  listImage: {
    width: '100%',
    height: 134,
  },
  tagRow: {
    position: 'absolute',
    left: 14,
    bottom: 13,
    flexDirection: 'row',
    gap: 6,
  },
  tagPill: {
    height: 24,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B2FFD2',
  },
  tagLabel: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.07,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 8,
  },
  avatarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginTop: -20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
  },
  verifiedIcon: {
    width: 20,
    height: 20,
    marginTop: 3,
  },
  brandName: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.08,
  },
  services: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.07,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
  },
});

// Campaign card (Figma nodes 6770:6078 "hero" carousel variant + 6121:6627/
// 6659/6684/6709 "list" variant). Both share the same DNA - image, gender
// tag pills overlaid on the image's bottom-left corner, title + verified
// badge, price + due date - but differ in corner radius, shadow, and
// whether a circular brand avatar (hero, overlapping the image) or a plain
// brand-name text line (list) is shown. See docs/screen/home for detail.
function CampaignCard({
  variant = 'list',
  image,
  brandAvatar,
  brandName,
  title,
  verified,
  tags,
  servicesDescription,
  price,
  dueDate,
  onPress,
  style,
  testID,
}: CampaignCardProps) {
  const { colors, palette } = useTheme();
  const isHero = variant === 'hero';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[isHero ? styles.hero : styles.list, { backgroundColor: colors.card }, style]}>
      <View style={styles.imageWrap}>
        <Image
          source={image}
          style={isHero ? styles.heroImage : styles.listImage}
          contentFit="cover"
        />
        {!!tags?.length && (
          <View style={styles.tagRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {isHero ? (
          <View style={styles.avatarTitleRow}>
            {brandAvatar && <Image source={brandAvatar} style={styles.avatar} contentFit="cover" />}
            <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
              {title}
            </Text>
            {verified && (
              <Image source={verifiedBadge} style={styles.verifiedIcon} contentFit="contain" />
            )}
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
              {title}
            </Text>
            {verified && (
              <Image source={verifiedBadge} style={styles.verifiedIcon} contentFit="contain" />
            )}
          </View>
        )}

        {!isHero && brandName && (
          <Text style={[styles.brandName, { color: palette.primary[400] }]}>{brandName}</Text>
        )}

        {servicesDescription && (
          <Text style={[styles.services, { color: palette.gray[300] }]}>{servicesDescription}</Text>
        )}

        <View style={styles.footerRow}>
          <Text style={[styles.price, { color: colors.text.primary }]}>{price}</Text>
          <CalendarBadge date={dueDate} />
        </View>
      </View>
    </Pressable>
  );
}

export default CampaignCard;
