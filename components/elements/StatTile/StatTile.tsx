import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface StatTileProps {
  icon: ImageSourcePropType;
  label: string;
  value: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderRadius: 8,
    paddingLeft: 14,
    paddingTop: 18,
    paddingRight: 8,
    paddingBottom: 18,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});

// Tinted icon + label + value tile (Figma "Frame" nodes 6001:37683/37684/
// 37685, the Campaign Details screen's Budget/Duration/Follower wanted row)
// - three of these sit side by side. `backgroundColor` defaults to Figma's
// confirmed `palette.gray[25]` but is overridable, generic enough for any
// future icon-stat tile this project doesn't have a design for yet.
function StatTile({ icon, label, value, backgroundColor, style, testID }: StatTileProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[styles.root, { backgroundColor: backgroundColor ?? palette.gray[25] }, style]}
      testID={testID}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <Text style={[styles.label, { color: palette.gray[400] }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );
}

export default StatTile;
