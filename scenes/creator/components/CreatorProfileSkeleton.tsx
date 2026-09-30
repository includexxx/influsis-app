import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { radius } from '@/theme';
import { myProfileStyle } from '@/scenes/profile/myProfile.style';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

const AVATAR_SIZE = 84;

const styles = StyleSheet.create({
  // Pulled up so the circle overlaps the hero above it, where the real
  // avatar ring sits (the screen renders the hero itself while loading).
  avatar: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    marginTop: -(AVATAR_SIZE / 2 + 4),
  },
  nameBlock: {
    width: '55%',
    height: 24,
    borderRadius: 6,
    marginTop: 12,
  },
  metaBlock: {
    width: '40%',
    height: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  bioBlock: {
    width: '100%',
    height: 14,
    borderRadius: 6,
    marginTop: 12,
  },
  bioBlockShort: {
    width: '70%',
    height: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  credBlock: {
    height: 84,
    borderRadius: radius.xl,
    marginTop: 20,
  },
  sectionTitleBlock: {
    width: '30%',
    height: 16,
    borderRadius: 6,
    marginTop: 24,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tagBlock: {
    width: 80,
    height: 30,
    borderRadius: radius.full,
  },
});

// Loading placeholder for the Creator Profile screen, shaped like its real
// layout (My Profile's - scenes/profile/myProfile.style.ts) below the hero:
// the overlapping avatar, name, handle line, bio, the credibility strip,
// and a tag section.
function CreatorProfileSkeleton() {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(style: StyleProp<ViewStyle>) {
    return <Animated.View style={[style, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View style={myProfileStyle.content} testID="creator-profile-skeleton">
      {block(styles.avatar)}
      {block(styles.nameBlock)}
      {block(styles.metaBlock)}
      {block(styles.bioBlock)}
      {block(styles.bioBlockShort)}
      {block(styles.credBlock)}
      {block(styles.sectionTitleBlock)}
      <View style={styles.tagRow}>
        {block(styles.tagBlock)}
        {block(styles.tagBlock)}
        {block(styles.tagBlock)}
      </View>
    </View>
  );
}

export default CreatorProfileSkeleton;
