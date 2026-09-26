import { View, ScrollView, StyleSheet } from 'react-native';
import { Gig } from '@/types';
import { homeStyle } from '@/styles';
import SectionHeader from '@/components/elements/SectionHeader';
import GigCard from '@/components/elements/GigCard';

export interface TopGigsSectionProps {
  gigs: Gig[];
  onSeeAllPress?: () => void;
  onGigPress?: (id: string) => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Top Gigs" row (Figma node 6770:6071's sibling gig cards).
function TopGigsSection({ gigs, onSeeAllPress, onGigPress }: TopGigsSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Top Gigs"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.row, homeStyle.horizontalListGap]}>
          {gigs.map(item => (
            <GigCard key={item.id} {...item} onPress={() => onGigPress?.(item.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default TopGigsSection;
