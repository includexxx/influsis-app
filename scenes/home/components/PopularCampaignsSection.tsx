import { View, ScrollView, StyleSheet } from 'react-native';
import { PopularCampaign } from '@/data/home';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import CampaignMiniCard from '@/components/elements/CampaignMiniCard';

export interface PopularCampaignsSectionProps {
  campaigns: PopularCampaign[];
  onSeeAllPress?: () => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Popular Campaigns" row (Figma node 6121:6551).
function PopularCampaignsSection({ campaigns, onSeeAllPress }: PopularCampaignsSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Popular Campaigns"
        style={homeStyle.sectionHeaderGap}
        onSeeAllPress={onSeeAllPress}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.row, homeStyle.horizontalListGap]}>
          {campaigns.map(item => (
            <CampaignMiniCard key={item.id} {...item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default PopularCampaignsSection;
