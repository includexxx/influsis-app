import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { useSkeletonPulse } from '@/scenes/business/hooks/useSkeletonPulse';
import { campaignDetailsStyle } from '../campaignDetails.style';

const styles = StyleSheet.create({
  businessRow: {
    height: 74,
    borderRadius: 20,
  },
  budgetCard: {
    height: 132,
    borderRadius: 24,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factTile: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 104,
    borderRadius: 18,
  },
  sectionCard: {
    height: 150,
    borderRadius: 20,
  },
});

// Loading placeholder for Campaign Details, shaped like the real layout
// (campaignDetails.style.ts): the full-bleed cover, then the overlapping
// content sheet with the business row, budget card, fact tiles and a
// section card. The screen floats its back button over this.
function CampaignDetailsSkeleton() {
  const { colors, palette, isDark } = useTheme();
  const opacity = useSkeletonPulse();
  const blockColor = isDark ? palette.gray[700] : palette.gray[50];

  function block(style: StyleProp<ViewStyle>) {
    return <Animated.View style={[style, { backgroundColor: blockColor, opacity }]} />;
  }

  return (
    <View testID="campaign-details-skeleton">
      {block(campaignDetailsStyle.cover)}
      <View style={[campaignDetailsStyle.sheet, { backgroundColor: colors.background }]}>
        {block(styles.businessRow)}
        {block(styles.budgetCard)}
        <View style={styles.factGrid}>
          {block(styles.factTile)}
          {block(styles.factTile)}
          {block(styles.factTile)}
          {block(styles.factTile)}
        </View>
        {block(styles.sectionCard)}
      </View>
    </View>
  );
}

export default CampaignDetailsSkeleton;
