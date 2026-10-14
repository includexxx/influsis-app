import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../../hooks/useSkeletonPulse';

export type ApplicationsSkeletonVariant = 'application' | 'invitation';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  lines: { flex: 1, gap: 10 },
  lineLong: { width: '85%', height: 14, borderRadius: 7 },
  lineShort: { width: '45%', height: 12, borderRadius: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  amount: { width: 96, height: 18, borderRadius: 9 },
  pill: { width: 84, height: 26, borderRadius: 13 },
  facts: { height: 58, borderRadius: 14, marginHorizontal: 14 },
  actions: { flexDirection: 'row', gap: 10, padding: 14 },
  action: { flex: 1, height: 44, borderRadius: 22 },
});

// Loading placeholder shaped like ApplicationCard or InvitationCard, pulsing
// with the shared campaign skeleton animation.
export default function ApplicationsSkeleton({
  variant,
}: {
  variant: ApplicationsSkeletonVariant;
}) {
  const { colors, palette, isDark } = useTheme();
  const opacity = useSkeletonPulse();
  const block = { backgroundColor: isDark ? palette.gray[700] : palette.gray[50], opacity };
  const frame = { backgroundColor: colors.card, borderColor: colors.border };

  if (variant === 'invitation') {
    return (
      <View style={[styles.card, frame]} testID="invitation-card-skeleton">
        <View style={styles.row}>
          <Animated.View style={[styles.avatar, block]} />
          <View style={styles.lines}>
            <Animated.View style={[styles.lineShort, block]} />
            <Animated.View style={[styles.lineLong, block]} />
          </View>
        </View>
        <Animated.View style={[styles.facts, block]} />
        <View style={styles.actions}>
          <Animated.View style={[styles.action, block]} />
          <Animated.View style={[styles.action, block]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, frame]} testID="application-card-skeleton">
      <View style={styles.row}>
        <Animated.View style={[styles.thumb, block]} />
        <View style={styles.lines}>
          <Animated.View style={[styles.lineLong, block]} />
          <Animated.View style={[styles.lineShort, block]} />
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Animated.View style={[styles.amount, block]} />
        <Animated.View style={[styles.pill, block]} />
      </View>
    </View>
  );
}
