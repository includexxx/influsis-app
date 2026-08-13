import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface BulletListProps {
  items: string[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});

// Plain bulleted list (Figma "Description of this Gig" section, node
// 6401:5764 and siblings on the Gig Details screen) - generic enough for
// any future block of bullet copy this project doesn't have a design for
// yet.
function BulletList({ items, style, testID }: BulletListProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]} testID={testID}>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.bullet, { color: palette.gray[400] }]}>{'•'}</Text>
          <Text style={[styles.text, { color: palette.gray[400] }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default BulletList;
