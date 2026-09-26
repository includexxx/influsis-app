import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export interface BusinessAvatarSkeletonProps {
  size?: number;
  withLabel?: boolean;
}

const styles = StyleSheet.create({
  withLabel: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: '70%',
    height: 14,
    borderRadius: 6,
  },
});

// Loading placeholder for BusinessAvatar - a pulsing circle, with an
// optional label bar underneath for the Businesses grid (which shows a
// business name below each logo, unlike Home's plain logo row).
function BusinessAvatarSkeleton({ size = 80, withLabel }: BusinessAvatarSkeletonProps) {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  const circle = (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.gray[50],
        opacity,
      }}
    />
  );

  if (!withLabel) {
    return circle;
  }

  return (
    <View style={[styles.withLabel, { width: size }]}>
      {circle}
      <Animated.View style={[styles.label, { backgroundColor: palette.gray[50], opacity }]} />
    </View>
  );
}

export default BusinessAvatarSkeleton;
