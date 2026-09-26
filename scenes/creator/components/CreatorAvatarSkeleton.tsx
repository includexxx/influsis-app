import { Animated } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export interface CreatorAvatarSkeletonProps {
  size?: number;
}

// Loading placeholder for CreatorAvatar - a pulsing circle, matching Home's
// plain "Top Rated Creator" avatar row (no label, unlike the Businesses
// grid's logo+name layout).
function CreatorAvatarSkeleton({ size = 80 }: CreatorAvatarSkeletonProps) {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  return (
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
}

export default CreatorAvatarSkeleton;
