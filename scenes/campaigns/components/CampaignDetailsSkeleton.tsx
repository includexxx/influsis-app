import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '@/scenes/business/hooks/useSkeletonPulse';
import { campaignDetailsStyle } from '../campaignDetails.style';

const styles = StyleSheet.create({
  businessNameBlock: {
    width: '35%',
    height: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  titleBlock: {
    width: '75%',
    height: 22,
    borderRadius: 6,
    marginTop: 8,
  },
  statBlock: {
    flex: 1,
    height: 72,
    borderRadius: 12,
  },
  sectionTitleBlock: {
    width: '40%',
    height: 18,
    borderRadius: 6,
    marginTop: 24,
  },
  lineBlock: {
    width: '100%',
    height: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  lineBlockShort: {
    width: '65%',
    height: 14,
    borderRadius: 6,
    marginTop: 8,
  },
});

// Loading placeholder for the Campaign Details screen, shaped like its real
// layout (campaignDetails.style.ts): full-bleed banner with an overlapping
// avatar, business name, title, the stat tile row, then a text section.
function CampaignDetailsSkeleton() {
  const { palette } = useTheme();
  const opacity = useSkeletonPulse();

  function block(style: StyleProp<ViewStyle>) {
    return <Animated.View style={[style, { backgroundColor: palette.gray[50], opacity }]} />;
  }

  return (
    <View testID="campaign-details-skeleton">
      <View style={campaignDetailsStyle.bannerWrap}>
        {block(campaignDetailsStyle.banner)}
        {block(campaignDetailsStyle.avatar)}
      </View>
      <View style={campaignDetailsStyle.content}>
        {block(styles.businessNameBlock)}
        {block(styles.titleBlock)}
        <View style={campaignDetailsStyle.statRow}>
          {block(styles.statBlock)}
          {block(styles.statBlock)}
          {block(styles.statBlock)}
        </View>
        {block(styles.sectionTitleBlock)}
        {block(styles.lineBlock)}
        {block(styles.lineBlock)}
        {block(styles.lineBlockShort)}
      </View>
    </View>
  );
}

export default CampaignDetailsSkeleton;
