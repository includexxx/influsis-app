import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette } from '@/theme';
import Image from '../Image';

const confettiImage = require('@/assets/images/withdraw/success-confetti.png');
const checkImage = require('@/assets/images/withdraw/success-check.png');

export interface SuccessHeroProps {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  // Figma's confetti burst is a fixed-size artboard (337.77x198.25, node
  // 6407:5797) with the tick sitting inside it. Capped at that size rather
  // than pinned to it, so it shrinks instead of bleeding past the gutter on
  // a device narrower than Figma's 430pt artboard.
  burst: {
    width: '100%',
    maxWidth: 338,
    aspectRatio: 338 / 198,
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  check: {
    width: 113,
    height: 113,
    marginTop: 39,
  },
  textGroup: {
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.72,
    textAlign: 'center',
    color: palette.gray[900],
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.28,
    textAlign: 'center',
    color: palette.gray[300],
  },
});

// Confetti burst + green tick + headline, the top half of the withdraw
// confirmation screen (Figma nodes 6407:5796 and 6407:5816).
//
// Kept separate from `SuccessSheet`, which is a bottom-sheet popup with a
// square badge and its own CTA. This is a full-screen, confetti-backed hero
// with no button, so the caller composes whatever receipt sits under it.
// The tick is one asset because Figma's "Check" node is the filled circle
// and the glyph together - unlike assets/images/icons/success-check.png,
// which is the bare tick.
function SuccessHero({ title, description, style, testID }: SuccessHeroProps) {
  return (
    <View style={[styles.root, style]} testID={testID}>
      <View style={styles.burst}>
        <Image source={confettiImage} style={styles.confetti} contentFit="contain" />
        <Image source={checkImage} style={styles.check} contentFit="contain" />
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </View>
  );
}

export default SuccessHero;
