import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface PaginationDotsProps {
  count: number;
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 20,
  },
});

function PaginationDots({ count, activeIndex, style }: PaginationDotsProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          testID={`pagination-dot-${index}`}
          style={[
            styles.dot,
            {
              width: index === activeIndex ? 30 : 15,
              backgroundColor: index === activeIndex ? palette.primary[400] : palette.gray[100],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default PaginationDots;
