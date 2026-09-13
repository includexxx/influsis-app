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
    width: '80%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, textAlign: 'center', fontWeight: 700 }}>404! Not Found!</Text>
        <Text style={{ fontSize: 18, textAlign: 'center', fontWeight: 500 }}>
          This page is not found!
        </Text>
      </View>
      <Link href="/" style={[styles.link, { backgroundColor: colors.primary }]}>
        <Text style={[styles.title, { color: colors.onPrimary }]}>Go to home screen!</Text>
      </Link>
    </View>
  );
}
