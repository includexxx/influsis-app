import { View, StyleSheet, Text, Pressable } from 'react-native';
import { useTheme } from '@/hooks';
import { Link } from 'expo-router';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default function Welcome() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.primary }]}>Welcome to Influsis..!</Text>
    </View>
  );
}
