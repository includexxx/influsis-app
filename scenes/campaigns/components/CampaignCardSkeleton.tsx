import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { radius } from '@/theme';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export type CampaignCardSkeletonVariant = 'hero' | 'list' | 'applied';

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
  // Same footprint as CampaignCard's applied row: 84 thumbnail, then the
  // date/status line, title and price.
  applied: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  thumb: { width: 84, height: 84, borderRadius: radius.lg },
  appliedBody: { flex: 1, justifyContent: 'space-between' },
  appliedTop: { flexDirection: 'row', justifyContent: 'space-between' },
  appliedDateBlock: { width: 80, height: 12, borderRadius: 6 },
  statusBlock: { width: 64, height: 22, borderRadius: 11 },
  appliedTitleBlock: { width: '85%', height: 15, borderRadius: 6 },
  appliedPriceBlock: { width: 72, height: 15, borderRadius: 6 },
});

// Loading placeholder shaped like CampaignCard (components/elements/
// CampaignCard) in the same `hero`/`list`/`applied` variants, so a preview
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

  const frame = { backgroundColor: colors.card, borderColor: colors.border };

  if (variant === 'applied') {
    return (
      <View style={[styles.applied, frame, style]} testID="campaign-card-skeleton">
        {block(styles.thumb, 'thumb')}
        <View style={styles.appliedBody}>
          <View style={styles.appliedTop}>
            {block(styles.appliedDateBlock, 'date')}
            {block(styles.statusBlock, 'status')}
          </View>
          {block(styles.appliedTitleBlock, 'title')}
          {block(styles.appliedPriceBlock, 'price')}
        </View>
      </View>
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
