import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export type CampaignCardSkeletonVariant = 'hero' | 'list' | 'applied';

export interface CampaignCardSkeletonProps {
  variant?: CampaignCardSkeletonVariant;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  hero: {
    width: 370,
    borderRadius: 16,
    overflow: 'hidden',
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 139,
  },
  listImage: {
    width: '100%',
    height: 134,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 10,
  },
  contentApplied: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
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
  },
  titleBlock: {
    flex: 1,
    height: 20,
    borderRadius: 6,
  },
  businessNameBlock: {
    width: '45%',
    height: 14,
    borderRadius: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceBlock: {
    width: 70,
    height: 20,
    borderRadius: 6,
  },
  dateBlock: {
    width: 90,
    height: 16,
    borderRadius: 6,
  },
});

// Loading placeholder shaped like CampaignCard (components/elements/
// CampaignCard) in the same `hero`/`list`/`applied` variants, so a preview
// section and its full-list screen don't jump in size once real data
// replaces it. A single shared opacity pulse (useSkeletonPulse) drives every
// block.
function CampaignCardSkeleton({ variant = 'list', style }: CampaignCardSkeletonProps) {
  const { colors, palette } = useTheme();
  const opacity = useSkeletonPulse();
  const isHero = variant === 'hero';
  const isApplied = variant === 'applied';

  function block(blockStyle: StyleProp<ViewStyle>, key: string) {
    return (
      <Animated.View
        key={key}
        style={[blockStyle, { backgroundColor: palette.gray[50], opacity }]}
      />
    );
  }

  return (
    <View
      style={[isHero ? styles.hero : styles.list, { backgroundColor: colors.card }, style]}
      testID="campaign-card-skeleton">
      {block(isHero ? styles.heroImage : styles.listImage, 'image')}
      {isApplied ? (
        <View style={styles.contentApplied}>
          <View style={styles.footerRow}>
            {block(styles.dateBlock, 'date')}
            {block(styles.priceBlock, 'price')}
          </View>
          {block(styles.titleBlock, 'title')}
        </View>
      ) : (
        <View style={styles.content}>
          {isHero ? (
            <View style={styles.avatarTitleRow}>
              {block(styles.avatar, 'avatar')}
              {block(styles.titleBlock, 'title')}
            </View>
          ) : (
            <>
              {block(styles.titleBlock, 'title')}
              {block(styles.businessNameBlock, 'businessName')}
            </>
          )}
          <View style={styles.footerRow}>
            {block(styles.priceBlock, 'price')}
            {block(styles.dateBlock, 'date')}
          </View>
        </View>
      )}
    </View>
  );
}

export default CampaignCardSkeleton;
