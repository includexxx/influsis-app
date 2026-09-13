import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface SectionHeaderProps {
  title: string;
  onSeeAllPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});

// "Title" + "See all" row repeated at the top of every Home screen section
// (Active Campaigns, Business, Popular Campaigns, Campaigns, Top Gigs, Top
// Rated Creator - Figma node 6121:6539 and five siblings with the same
// shape).
function SectionHeader({ title, onSeeAllPress, style }: SectionHeaderProps) {
  const { colors, palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.seeAll, { color: palette.primary[400] }]} onPress={onSeeAllPress}>
        See all
      </Text>
    </View>
  );
}

export default SectionHeader;
