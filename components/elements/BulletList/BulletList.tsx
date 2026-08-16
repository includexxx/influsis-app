import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface BulletListProps {
  items: string[];
  color?: string;
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
// yet. `color` defaults to Figma's original `gray[400]` but is overridable -
// added for the Order Details screen's "Requirements" list (node
// 6040:8515), whose lighter `gray[300]` doesn't match this component's
// original caller.
function BulletList({ items, color, style, testID }: BulletListProps) {
  const { palette } = useTheme();
  const resolvedColor = color ?? palette.gray[400];

  return (
    <View style={[styles.root, style]} testID={testID}>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.bullet, { color: resolvedColor }]}>{'•'}</Text>
          <Text style={[styles.text, { color: resolvedColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default BulletList;
