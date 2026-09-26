import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

export interface CreatorCardSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 148,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 10,
  },
  nameBlock: {
    width: '55%',
    height: 20,
    borderRadius: 6,
  },
  locationBlock: {
    width: '40%',
    height: 14,
    borderRadius: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  tagBlock: {
    width: 70,
    height: 28,
    borderRadius: 25,
  },
});

// Loading placeholder shaped like CreatorCard (components/elements/
// CreatorCard) - image, name/location lines, a couple of pill placeholders -
// so the Top Creators list doesn't jump in size once real data replaces it.
function CreatorCardSkeleton({ style }: CreatorCardSkeletonProps) {
  const { colors, palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(blockStyle: object) {
    return <Animated.View style={[blockStyle, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.card }, style]}>
      {block(styles.image)}
      <View style={styles.content}>
        {block(styles.nameBlock)}
        {block(styles.locationBlock)}
        <View style={styles.bottomRow}>
          {block(styles.tagBlock)}
          {block(styles.tagBlock)}
        </View>
      </View>
    </View>
  );
}

export default CreatorCardSkeleton;
