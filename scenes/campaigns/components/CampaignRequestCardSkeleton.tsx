import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle, radius, spacing } from '@/theme';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export interface CampaignRequestCardSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: 13,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  titleBlock: {
    width: '90%',
    height: 17,
    borderRadius: 6,
  },
  timeBlock: {
    width: '35%',
    height: 14,
    borderRadius: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBlock: {
    width: 53,
    height: 23,
    borderRadius: radius.full,
  },
});

// Loading placeholder shaped like CampaignRequestCard (components/elements/
// CampaignRequestCard) - the Applications screen's "Request" tab rows.
function CampaignRequestCardSkeleton({ style }: CampaignRequestCardSkeletonProps) {
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
      style={[styles.root, getShadowStyle('sm'), { backgroundColor: colors.card }, style]}
      testID="campaign-request-card-skeleton">
      {block(styles.avatar, 'avatar')}
      <View style={styles.content}>
        {block(styles.titleBlock, 'title')}
        {block(styles.timeBlock, 'time')}
        <View style={styles.actions}>
          {block(styles.actionBlock, 'accept')}
          {block(styles.actionBlock, 'decline')}
        </View>
      </View>
    </View>
  );
}

export default CampaignRequestCardSkeleton;
