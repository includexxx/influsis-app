import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { businessDetailsStyle } from '../businessDetails.style';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';

const styles = StyleSheet.create({
  nameBlock: {
    width: '55%',
    height: 20,
    borderRadius: 6,
  },
  websiteBlock: {
    width: '40%',
    height: 14,
    borderRadius: 6,
    marginTop: 12,
  },
  descriptionBlock: {
    width: '100%',
    height: 14,
    borderRadius: 6,
    marginTop: 16,
  },
  descriptionBlockShort: {
    width: '70%',
    height: 14,
    borderRadius: 6,
    marginTop: 8,
  },
});

// Loading placeholder for the Business Details screen, shaped like its real
// layout (scenes/business/businessDetails.style.ts): full-bleed banner with an overlapping
// circular avatar, then name/website/description lines.
function BusinessDetailsSkeleton() {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(style: object) {
    return <Animated.View style={[style, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View>
      <View style={businessDetailsStyle.bannerWrap}>
        {block(businessDetailsStyle.banner)}
        {block(businessDetailsStyle.avatar)}
      </View>
      <View style={businessDetailsStyle.content}>
        {block(styles.nameBlock)}
        {block(styles.websiteBlock)}
        {block(styles.descriptionBlock)}
        {block(styles.descriptionBlockShort)}
      </View>
    </View>
  );
}

export default BusinessDetailsSkeleton;
