import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { fonts } from '@/theme';
import Image from '@/components/elements/Image';

const ellipseTop = require('@/assets/images/onboarding/ellipse-top.png');
const ellipseBottom = require('@/assets/images/onboarding/ellipse-bottom.png');

// how long the brand reveal stays on screen before auto-advancing if the
// user doesn't tap - the Figma node has no button, so this mirrors a
// typical splash/loading beat.
const AUTO_ADVANCE_DELAY_MS = 5000;
const DOT_COUNT = 3;
const DOT_PULSE_DURATION_MS = 400;
const DOT_MIN_OPACITY = 0.25;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ellipseTop: {
    position: 'absolute',
    top: -150,
    right: -90,
    width: 320,
    height: 325,
  },
  ellipseBottom: {
    position: 'absolute',
    bottom: -150,
    left: -190,
    width: 320,
    height: 325,
  },
  wordmarkRow: {
    flexDirection: 'row',
  },
  wordmark: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 48,
  },
});

export default function Intro() {
  const { colors, palette } = useTheme();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotOpacities = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(DOT_MIN_OPACITY))
  ).current;

  function goToCarousel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/onboarding/carousel');
  }

  useEffect(() => {
    timerRef.current = setTimeout(goToCarousel, AUTO_ADVANCE_DELAY_MS);

    const pulse = Animated.loop(
      Animated.stagger(
        DOT_PULSE_DURATION_MS,
        dotOpacities.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: DOT_PULSE_DURATION_MS,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: DOT_MIN_OPACITY,
              duration: DOT_PULSE_DURATION_MS,
              useNativeDriver: true,
            }),
          ])
        )
      )
    );
    pulse.start();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pulse.stop();
    };
  }, []);

  return (
    <Pressable style={[styles.root, { backgroundColor: colors.background }]} onPress={goToCarousel}>
      <Image source={ellipseTop} style={styles.ellipseTop} contentFit="contain" />
      <Image source={ellipseBottom} style={styles.ellipseBottom} contentFit="contain" />
      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmark, { color: palette.primary[400] }]}>Influsis</Text>
        {dotOpacities.map((dot, index) => (
          <Animated.Text
            key={index}
            style={[styles.wordmark, { color: palette.primary[400], opacity: dot }]}
          >
            .
          </Animated.Text>
        ))}
      </View>
    </Pressable>
  );
}
