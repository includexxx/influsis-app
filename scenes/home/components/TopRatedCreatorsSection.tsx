import { View, ScrollView, StyleSheet, ImageSourcePropType } from 'react-native';
import { homeStyle } from '@/styles';
import SectionHeader from '@/components/elements/SectionHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';

export interface TopRatedCreator {
  id: string;
  image: ImageSourcePropType;
}

export interface TopRatedCreatorsSectionProps {
  creators: TopRatedCreator[];
  onSeeAllPress?: () => void;
  onCreatorPress?: (id: string) => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Top Rated Creator" avatar row (Figma node 6121:6533).
function TopRatedCreatorsSection({
  creators,
  onSeeAllPress,
  onCreatorPress,
}: TopRatedCreatorsSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Top Rated Creator"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.row, homeStyle.avatarListGap]}>
          {creators.map(item => (
            <CircleAvatar
              key={item.id}
              source={item.image}
              onPress={() => onCreatorPress?.(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default TopRatedCreatorsSection;
