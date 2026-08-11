import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function Home() {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[typography.displayM, { color: colors.text.primary }]}>Home</Text>
    </View>
  );
}
