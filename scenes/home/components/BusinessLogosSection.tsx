import { View, ScrollView, StyleSheet, ImageSourcePropType } from 'react-native';
import { homeStyle } from '@/styles';
import SectionHeader from '@/components/elements/SectionHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';

export interface BusinessLogo {
  id: string;
  source: ImageSourcePropType;
}

export interface BusinessLogosSectionProps {
  businesses: BusinessLogo[];
  onSeeAllPress?: () => void;
  onBusinessPress?: (id: string) => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Business" logo row (Figma node 6770:6071).
function BusinessLogosSection({
  businesses,
  onSeeAllPress,
  onBusinessPress,
}: BusinessLogosSectionProps) {
  return (
    <View>
      <SectionHeader
        title="Business"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.row, homeStyle.avatarListGap]}>
          {businesses.map(item => (
            <CircleAvatar
              key={item.id}
              source={item.source}
              onPress={() => onBusinessPress?.(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default BusinessLogosSection;
