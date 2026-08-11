import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { fonts } from '@/theme';
import Image from '@/components/elements/Image';

const ellipseTop = require('@/assets/images/onboarding/ellipse-top.png');
const ellipseBottom = require('@/assets/images/onboarding/ellipse-bottom.png');

// how long the brand reveal stays on screen before auto-advancing - the
// Figma node has no button, so this mirrors a typical splash/intro beat.
const AUTO_ADVANCE_DELAY_MS = 5000;

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
  wordmark: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 48,
  },
});

export default function Intro() {
  const { colors, palette } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding/carousel');
    }, AUTO_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Image source={ellipseTop} style={styles.ellipseTop} contentFit="contain" />
      <Image source={ellipseBottom} style={styles.ellipseBottom} contentFit="contain" />
      <Text style={[styles.wordmark, { color: palette.primary[400] }]}>Influsis.</Text>
    </View>
  );
}
