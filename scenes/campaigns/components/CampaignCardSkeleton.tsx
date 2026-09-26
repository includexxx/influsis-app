import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export type CampaignCardSkeletonVariant = 'hero' | 'list';

export interface CampaignCardSkeletonProps {
  variant?: CampaignCardSkeletonVariant;
  style?: StyleProp<ViewStyle>;
}

const PULSE_DURATION_MS = 700;
const MIN_OPACITY = 0.4;

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
// CampaignCard) in the same `hero`/`list` variants, so a preview section and
// its full-list screen don't jump in size once real data replaces it. A
// single shared opacity pulse (same technique as scenes/onboarding/
// Intro.tsx's dot animation) drives every block.
function CampaignCardSkeleton({ variant = 'list', style }: CampaignCardSkeletonProps) {
  const { colors, palette } = useTheme();
  const opacity = useRef(new Animated.Value(MIN_OPACITY)).current;
  const isHero = variant === 'hero';

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: MIN_OPACITY,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

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
    </View>
  );
}

export default CampaignCardSkeleton;
