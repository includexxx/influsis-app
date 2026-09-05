import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { useAppSlice } from '@/slices';
import { layoutStyle } from '@/styles';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

// Placeholder landing tab of the main app shell (Figma tab bar, node
// 6355:6595) - no Home screen design exists yet (docs/PRD.md §4.1 Epic 4),
// same "title + note" placeholder pattern the boilerplate used for its own
// demo screens before this flow replaced them.
export default function Home() {
  const { colors } = useTheme();
  const { user } = useAppSlice();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          The Home feed isn&apos;t built yet - this is a placeholder for the main app shell.
        </Text>
      </View>
    </SafeAreaView>
  );
}
