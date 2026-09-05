import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface DividerProps {
  label?: string;
  style?: StyleProp<TextStyle>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

function Divider({ label = 'Or', style }: DividerProps) {
  const { palette } = useTheme();

  return <Text style={[styles.label, { color: palette.gray[300] }, style]}>{label}</Text>;
}

export default Divider;
