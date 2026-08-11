import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function Welcome() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text>Welcome to Influsis..!</Text>
    </View>
  );
}
