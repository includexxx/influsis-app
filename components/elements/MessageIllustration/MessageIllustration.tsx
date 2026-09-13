import { Platform, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const noMessageIcon = require('@/assets/images/messages/no-message.png');

export interface MessageIllustrationProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Figma's `4px 8px 16px rgba(15,23,42,0.04)` lens shadow, platform-branched
// the same way SearchIllustration's identical `lensShadow` is - raw
// `shadow*` style props are deprecated on React Native Web in favor of
// `boxShadow`.
const lensShadow =
  Platform.OS === 'web'
    ? { boxShadow: '4px 8px 16px rgba(15, 23, 42, 0.04)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 4, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 1,
      };

const styles = StyleSheet.create({
  root: {
    width: 107,
    height: 107,
    borderRadius: 53.5,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...lensShadow,
  },
  icon: {
    width: 41,
    height: 41,
  },
  // Four decorative dots scattered around the outer circle's edge (Figma
  // "Ellipse 258-261") - plain colored Views rather than raster assets,
  // since they're just solid circles. Positions are the exact pixel offsets
  // Figma reports relative to this 107x107 circle.
  dotPink: {
    position: 'absolute',
    left: -12,
    top: 13,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
    backgroundColor: '#C21975',
  },
  dotTeal: {
    position: 'absolute',
    left: 103,
    top: 8,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
    backgroundColor: '#2DD4BF',
  },
  dotGray: {
    position: 'absolute',
    left: 112,
    top: 15,
    width: 6.2,
    height: 6.2,
    borderRadius: 3.1,
    backgroundColor: '#E5E7EB',
  },
  dotBrand: {
    position: 'absolute',
    left: -12,
    top: 95,
    width: 3.6,
    height: 3.6,
    borderRadius: 1.8,
  },
});

// "No messages" illustration (Figma node 6366:6613) used by the Messages
// tab's empty state, paired with EmptyState for the title/description.
// A chat-bubble glyph centered in a white circle ("lens"), inside a light
// gray disc with four scattered decorative dots - structurally identical to
// SearchIllustration, which the Search screen's empty state already uses;
// only the centered glyph differs. The glyph is Figma's own 14-layer vector
// flattened into one PNG by scripts/rasterize-messages-assets.py.
function MessageIllustration({ style, testID }: MessageIllustrationProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]} testID={testID}>
      <View style={styles.dotPink} />
      <View style={styles.dotTeal} />
      <View style={styles.dotGray} />
      <View style={[styles.dotBrand, { backgroundColor: palette.primary[400] }]} />
      <View style={styles.lens}>
        <Image source={noMessageIcon} style={styles.icon} contentFit="contain" />
      </View>
    </View>
  );
}

export default MessageIllustration;
