import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export type CampaignCardSkeletonVariant = 'hero' | 'list';

export interface CampaignCardSkeletonProps {
  variant?: CampaignCardSkeletonVariant;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  // Same footprint as CampaignCard's cover cards: hero 220 / list 262 tall,
  // 24 radius, with the glass panel's shape at the bottom.
  coverCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  hero: { width: 370, height: 220 },
  list: { height: 262 },
  coverFill: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  lines: { flex: 1, gap: 6 },
  titleBlock: { width: '75%', height: 14, borderRadius: 6 },
  subBlock: { width: '45%', height: 10, borderRadius: 5 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { width: 92, height: 30, borderRadius: 15 },
});

// Loading placeholder shaped like CampaignCard (components/elements/
// CampaignCard) in the same `hero`/`list` variants, so a preview
// section and its full-list screen don't jump in size once real data
// replaces it. A single shared opacity pulse (useSkeletonPulse) drives every
// block.
function CampaignCardSkeleton({ variant = 'list', style }: CampaignCardSkeletonProps) {
  const { colors, palette } = useTheme();
  const opacity = useSkeletonPulse();

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
      style={[styles.coverCard, variant === 'hero' ? styles.hero : styles.list, style]}
      testID="campaign-card-skeleton">
      {block(styles.coverFill, 'cover')}
      <View style={[styles.panel, { backgroundColor: colors.card }]}>
        <View style={styles.panelRow}>
          {block(styles.avatar, 'avatar')}
          <View style={styles.lines}>
            {block(styles.titleBlock, 'title')}
            {block(styles.subBlock, 'business')}
          </View>
        </View>
        <View style={styles.chips}>
          {block(styles.chip, 'price')}
          {block(styles.chip, 'date')}
        </View>
      </View>
    </View>
  );
}

export default CampaignCardSkeleton;
