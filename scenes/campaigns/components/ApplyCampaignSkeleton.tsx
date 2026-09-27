import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '../hooks/useSkeletonPulse';
import { applyCampaignStyle } from '../applyCampaign.style';

const styles = StyleSheet.create({
  headingBlock: {
    width: '60%',
    height: 24,
    borderRadius: 6,
  },
  recapBlock: {
    height: 53,
    borderRadius: 12,
  },
  sectionTitleBlock: {
    width: '40%',
    height: 24,
    borderRadius: 6,
  },
  textareaBlock: {
    height: 154,
    borderRadius: 12,
  },
  fieldBlock: {
    height: 53,
    borderRadius: 12,
  },
  buttonBlock: {
    height: 56,
    borderRadius: 999,
  },
});

// Loading placeholder shaped like the Apply Campaign form (ApplyCampaign.tsx)
// while its campaign loads: heading + recap fields, then the pitch, rate and
// link sections, then the Apply button.
function ApplyCampaignSkeleton() {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(blockStyle: StyleProp<ViewStyle>) {
    return <Animated.View style={[blockStyle, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View style={applyCampaignStyle.content} testID="apply-campaign-skeleton">
      <View style={applyCampaignStyle.sectionBlock}>
        {block(styles.headingBlock)}
        {block(styles.recapBlock)}
        {block(styles.recapBlock)}
      </View>
      <View style={applyCampaignStyle.sectionBlock}>
        {block(styles.sectionTitleBlock)}
        {block(styles.textareaBlock)}
      </View>
      <View style={applyCampaignStyle.sectionBlock}>
        {block(styles.sectionTitleBlock)}
        {block(styles.fieldBlock)}
      </View>
      {block(styles.buttonBlock)}
    </View>
  );
}

export default ApplyCampaignSkeleton;
