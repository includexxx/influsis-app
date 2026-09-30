import { Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '@/components/elements/Image';

const searchIcon = require('@/assets/images/home/search.png');

export interface HomeSearchBarProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 54,
    borderRadius: 67,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  placeholder: {
    fontSize: 16,
  },
});

// Search entry point at the top of the Home screen (Figma "Home", node 6121:6522).
function HomeSearchBar({ onPress, style }: HomeSearchBarProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search your campaign"
      onPress={onPress}
      style={[
        styles.root,
        { borderColor: palette.gray[50], backgroundColor: palette.gray[25] },
        style,
      ]}>
      <Image source={searchIcon} style={styles.icon} contentFit="contain" />
      <Text style={[styles.placeholder, { color: palette.gray[300] }]}>Search your campaign</Text>
    </Pressable>
  );
}

export default HomeSearchBar;
