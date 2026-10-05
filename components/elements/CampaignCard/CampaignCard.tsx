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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import Image from '../Image';
import FallbackImage from '../FallbackImage';
import CalendarBadge from '../CalendarBadge';
import StatusBadge from '../StatusBadge';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
// Shown when a campaign has no cover photo, or its URL fails to load - the
// same generic campaign hero image the mock Home data used for this slot.
const defaultCover: ImageSourcePropType = require('@/assets/images/home/hero-campaign.jpg');

export type CampaignCardVariant = 'hero' | 'list' | 'applied';

export interface CampaignCardProps {
  variant?: CampaignCardVariant;
  /** Cover photo; `null` (or a URL that fails to load) shows a generic cover. */
  image: ImageSourcePropType | null;
  /** Hero variant only; `null` (or a broken URL) shows the business initial. */
  businessAvatar?: ImageSourcePropType | null;
  businessName?: string;
  title: string;
  verified?: boolean;
  tags?: string[];
  servicesDescription?: string;
  status?: string;
  statusColor?: string;
  statusTextColor?: string;
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
  // Hero: a full-bleed cover with a dark scrim so white text stays legible
  // on any photo (WCAG contrast), title and money on top of it.
  hero: {
    height: 210,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroCover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    gap: 8,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  heroTag: {
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  heroTagLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D1F2C',
  },
  heroBottom: {
    marginTop: 'auto',
    padding: 14,
    gap: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroPriceChip: {
    backgroundColor: '#FFFFFF',
  },
  heroChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D1F2C',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
    ...listShadow,
  },
  imageWrap: {
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    height: 26,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 1,
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
  // Content padding for the `applied` variant - image-to-row gap (14),
  // row-to-title gap (8) and bottom padding (20) all confirmed from Figma's
  // pixel positions (Applications screen, node 6015:7202 and siblings).
  contentApplied: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 8,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedDate: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.07,
  },
  appliedPrice: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.07,
    fontWeight: '600',
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
  businessName: {
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
// 6659/6684/6709 "list" variant). Both carry the same data - image, gender
// tag pills, title + verified badge, price + due date. The list variant
// stacks them under the image; the hero variant (Home's Active Campaigns
// carousel) lays them over a full-bleed cover behind a dark scrim, with the
// business avatar beside the title. See docs/screen/home for detail. The
// optional `status` pill (Figma node 6138:5549, "Ongoing") added for the
// Search screen's result cards (docs/screen/search) sits top-right of the
// whole card via the shared `StatusBadge` component.
function CampaignCard({
  variant = 'list',
  image,
  businessAvatar,
  businessName,
  title,
  verified,
  tags,
  servicesDescription,
  status,
  statusColor,
  statusTextColor,
  price,
  dueDate,
  onPress,
  style,
  testID,
}: CampaignCardProps) {
  const { colors, palette } = useTheme();
  const isHero = variant === 'hero';
  const isApplied = variant === 'applied';

  if (isHero) {
    return (
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${title}, ${price}, due ${dueDate}`}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.hero,
          { backgroundColor: palette.gray[700] },
          style,
          pressed && onPress ? styles.pressed : null,
        ]}>
        <FallbackImage
          source={image}
          fallbackSource={defaultCover}
          name={title}
          style={styles.heroCover}
        />
        <LinearGradient
          colors={['rgba(3, 3, 4, 0.05)', 'rgba(3, 3, 4, 0.35)', 'rgba(3, 3, 4, 0.85)']}
          locations={[0, 0.45, 1]}
          style={styles.heroScrim}
        />

        <View style={styles.heroTop}>
          <View style={styles.heroTags}>
            {tags?.map(tag => (
              <View key={tag} style={styles.heroTag}>
                <Text style={styles.heroTagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
          {status && <StatusBadge label={status} color={statusColor} textColor={statusTextColor} />}
        </View>

        <View style={styles.heroBottom}>
          <View style={styles.heroTitleRow}>
            {(businessAvatar || businessName) && (
              <FallbackImage
                source={businessAvatar}
                name={businessName ?? title}
                style={styles.heroAvatar}
              />
            )}
            <Text style={styles.heroTitle} numberOfLines={2}>
              {title}
            </Text>
            {verified && (
              <Image source={verifiedBadge} style={styles.verifiedIcon} contentFit="contain" />
            )}
          </View>
          <View style={styles.heroMetaRow}>
            <View style={[styles.heroChip, styles.heroPriceChip]}>
              <Text style={styles.heroPriceText}>{price}</Text>
            </View>
            <View style={styles.heroChip}>
              <Feather name="calendar" size={13} color="#FFFFFF" />
              <Text style={styles.heroChipText}>{dueDate}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.list, { backgroundColor: colors.card }, style]}>
      <View style={styles.imageWrap}>
        <FallbackImage
          source={image}
          fallbackSource={defaultCover}
          name={title}
          style={styles.listImage}
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

      {status && (
        <StatusBadge
          label={status}
          color={statusColor}
          textColor={statusTextColor}
          style={styles.statusBadge}
        />
      )}

      <View style={isApplied ? styles.contentApplied : styles.content}>
        {isApplied ? (
          <>
            <View style={styles.appliedRow}>
              <Text style={[styles.appliedDate, { color: palette.gray[300] }]}>{dueDate}</Text>
              <Text style={[styles.appliedPrice, { color: colors.text.primary }]}>{price}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
              {title}
            </Text>
          </>
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

        {!isApplied && businessName && (
          <Text style={[styles.businessName, { color: palette.primary[400] }]}>{businessName}</Text>
        )}

        {!isApplied && servicesDescription && (
          <Text style={[styles.services, { color: palette.gray[300] }]}>{servicesDescription}</Text>
        )}

        {!isApplied && (
          <View style={styles.footerRow}>
            <Text style={[styles.price, { color: colors.text.primary }]}>{price}</Text>
            <CalendarBadge date={dueDate} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default CampaignCard;
