import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/hooks';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    height: 44,
    width: '50%',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Link href="/" style={[styles.link, { backgroundColor: colors.primary }]}>
        <Text style={[styles.title, { color: colors.onPrimary }]}>Go to home screen!</Text>
      </Link>
    </View>
  );
}
