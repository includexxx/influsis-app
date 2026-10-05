import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { radius } from '@/theme';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';
import { BusinessCardVariant } from './BusinessCard';

export interface BusinessCardSkeletonProps {
  variant?: BusinessCardVariant;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl },
  stack: { padding: 14, gap: 12 },
  stackTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stackBody: { flex: 1, gap: 8 },
  grid: { paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', gap: 6 },
});

// Loading placeholder with the same footprint as BusinessCard in either
// view, so the list doesn't jump when real rows replace it. One shared pulse
// (useSkeletonPulse) drives every block.
function BusinessCardSkeleton({ variant = 'stack', style }: BusinessCardSkeletonProps) {
  const { colors, palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(blockStyle: ViewStyle) {
    return <Animated.View style={[blockStyle, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  const frame = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  if (variant === 'grid') {
    return (
      <View style={[frame, styles.grid, style]} testID="business-card-skeleton">
        {block({ width: 68, height: 68, borderRadius: 34 })}
        {block({ width: '75%', height: 14, borderRadius: 7 })}
        {block({ width: '55%', height: 11, borderRadius: 6 })}
        {block({ width: 64, height: 22, borderRadius: 11 })}
      </View>
    );
  }

  return (
    <View style={[frame, styles.stack, style]} testID="business-card-skeleton">
      <View style={styles.stackTop}>
        {block({ width: 56, height: 56, borderRadius: 28 })}
        <View style={styles.stackBody}>
          {block({ width: '60%', height: 14, borderRadius: 7 })}
          {block({ width: '40%', height: 11, borderRadius: 6 })}
        </View>
      </View>
      {block({ width: '100%', height: 11, borderRadius: 6 })}
      {block({ width: '80%', height: 11, borderRadius: 6 })}
      <View style={styles.chips}>
        {block({ width: 64, height: 22, borderRadius: 11 })}
        {block({ width: 52, height: 22, borderRadius: 11 })}
      </View>
    </View>
  );
}

export default BusinessCardSkeleton;
