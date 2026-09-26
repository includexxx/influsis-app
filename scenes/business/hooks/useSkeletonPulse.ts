import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const PULSE_DURATION_MS = 700;
const MIN_OPACITY = 0.4;

// Shared opacity pulse for the business skeletons (BusinessAvatarSkeleton,
// BusinessDetailsSkeleton) - same technique as
// scenes/campaigns/components/CampaignCardSkeleton.tsx and
// scenes/onboarding/Intro.tsx's dot animation, factored out here since two
// skeleton components in this domain need the exact same loop.
export function useSkeletonPulse(): Animated.Value {
  const opacity = useRef(new Animated.Value(MIN_OPACITY)).current;

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

  return opacity;
}
