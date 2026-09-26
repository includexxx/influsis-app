import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { creatorProfileStyle } from '@/styles';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

const styles = StyleSheet.create({
  nameBlock: {
    width: '55%',
    height: 20,
    borderRadius: 6,
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
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  tagBlock: {
    width: 80,
    height: 28,
    borderRadius: 30,
  },
});

// Loading placeholder for the Creator Profile screen, shaped like its real
// layout (styles/creatorProfile.ts): full-bleed banner with an overlapping
// avatar, then name/bio lines and a row of tag placeholders.
function CreatorProfileSkeleton() {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(style: object) {
    return <Animated.View style={[style, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View>
      <View style={creatorProfileStyle.bannerWrap}>
        {block(creatorProfileStyle.banner)}
        {block(creatorProfileStyle.avatar)}
      </View>
      <View style={creatorProfileStyle.content}>
        {block(styles.nameBlock)}
        {block(styles.bioBlock)}
        {block(styles.bioBlockShort)}
        <View style={styles.tagRow}>
          {block(styles.tagBlock)}
          {block(styles.tagBlock)}
          {block(styles.tagBlock)}
        </View>
      </View>
    </View>
  );
}

export default CreatorProfileSkeleton;
