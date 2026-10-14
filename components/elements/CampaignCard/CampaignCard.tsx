import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import Image from '../Image';
import FallbackImage from '../FallbackImage';
import StatusBadge from '../StatusBadge';

const verifiedBadge = require('@/assets/images/home/verified-badge.png');
// Shown when a campaign has no cover photo, or its URL fails to load - the
// same generic campaign hero image the mock Home data used for this slot.
const defaultCover: ImageSourcePropType = require('@/assets/images/home/hero-campaign.jpg');

export type CampaignCardVariant = 'hero' | 'list';

export interface CampaignCardProps {
  variant?: CampaignCardVariant;
  /** Cover photo; `null` (or a URL that fails to load) shows a generic cover. */
  image: ImageSourcePropType | null;
  /** `null` (or a broken URL) shows the business initial. */
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

const WHITE = '#FFFFFF';
const INK = '#1D1F2C';

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  // --- Cover cards (hero + list): a full-bleed photo with a frosted-glass
  // panel over its bottom, so white text stays legible on any image. ---
  coverCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...getShadowStyle('md'),
  },
  heroHeight: { height: 220 },
  listHeight: { height: 262 },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    gap: 8,
  },
  tagRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Glass surfaces: a blur plus a translucent tint (the tint alone carries
  // the look where native blur is unavailable, e.g. Android's default) and
  // a hairline light border - the usual glassmorphism recipe.
  glassPill: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  glassPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
  },
  panel: {
    marginTop: 'auto',
    margin: 10,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(16, 16, 24, 0.28)',
  },
  panelInner: {
    padding: 12,
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: WHITE,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: WHITE,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessName: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.82)',
  },
  verifiedIcon: {
    width: 14,
    height: 14,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  services: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceChip: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: INK,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
});

// Campaign card (Figma nodes 6770:6078 "hero" carousel variant + 6121:6627/
// 6659/6684/6709 "list" variant):
// - `hero` (Home's Active Campaigns carousel) and `list` (Campaigns, Home,
//   Business details, Live Campaigns, Search) are cover cards: a full-bleed
//   photo under a soft scrim, tag and status pills on top, and a frosted-glass
//   panel at the bottom with the business avatar, title, business name +
//   verified badge, the deliverables (list), and white price / glass date
//   chips. `list` is taller to fit the deliverables line.
// Every variant is one labelled button with press feedback. See
// docs/screen/home and docs/screen/search for detail.
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
  const { palette } = useTheme();
  const accessibilityLabel = [title, businessName, status, price, dueDate]
    .filter(Boolean)
    .join(', ');

  const isList = variant === 'list';
  const showAvatar = !!(businessAvatar || businessName);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.coverCard,
        isList ? styles.listHeight : styles.heroHeight,
        { backgroundColor: palette.gray[700] },
        style,
        pressed && onPress ? styles.pressed : null,
      ]}>
      <FallbackImage
        source={image}
        fallbackSource={defaultCover}
        name={title}
        style={styles.cover}
      />
      <LinearGradient
        colors={['rgba(3, 3, 4, 0.30)', 'rgba(3, 3, 4, 0)', 'rgba(3, 3, 4, 0.55)']}
        locations={[0, 0.4, 1]}
        style={styles.scrim}
      />

      <View style={styles.top}>
        <View style={styles.tagRow}>
          {tags?.map(tag => (
            <BlurView key={tag} intensity={30} tint="light" style={styles.glassPill}>
              <Text style={styles.glassPillText}>{tag}</Text>
            </BlurView>
          ))}
        </View>
        {status && <StatusBadge label={status} color={statusColor} textColor={statusTextColor} />}
      </View>

      <BlurView intensity={40} tint="dark" style={styles.panel} testID="campaign-card-glass">
        <View style={styles.panelInner}>
          <View style={styles.identityRow}>
            {showAvatar && (
              <FallbackImage
                source={businessAvatar ?? null}
                name={businessName ?? title}
                style={styles.avatar}
              />
            )}
            <View style={styles.identityText}>
              <Text style={styles.title} numberOfLines={isList ? 2 : 1}>
                {title}
              </Text>
              {businessName || verified ? (
                <View style={styles.businessRow}>
                  {businessName ? (
                    <Text style={styles.businessName} numberOfLines={1}>
                      {businessName}
                    </Text>
                  ) : null}
                  {verified && (
                    <Image
                      source={verifiedBadge}
                      style={styles.verifiedIcon}
                      contentFit="contain"
                    />
                  )}
                </View>
              ) : null}
            </View>
          </View>

          {isList && servicesDescription ? (
            <View style={styles.servicesRow}>
              <Feather name="layers" size={13} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.services} numberOfLines={1}>
                {servicesDescription}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.priceChip}>
              <Text style={styles.priceText} numberOfLines={1}>
                {price}
              </Text>
            </View>
            <View style={styles.dateChip}>
              <Feather name="calendar" size={13} color={WHITE} />
              <Text style={styles.dateText} numberOfLines={1}>
                {dueDate}
              </Text>
            </View>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

export default CampaignCard;
