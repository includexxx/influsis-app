import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';

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
    marginBottom: 32,
  },
});

// The "Create Gig" tab bar button (Figma node 6355:6595) has no
// active/persisted tab state of its own - it's an action that opens this
// screen, matching Figma's own component (which never has a "Create Gig
// Active" variant unlike the other four tabs). Registered as a hidden route
// (`href: null`) inside app/(main) rather than a real tab bar destination -
// see app/(main)/_layout.tsx's `create-gig` tabPress listener.
export default function CreateGig() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Create Gig</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Gig creation isn&apos;t built yet - this is a placeholder for the main app shell.
        </Text>
      </View>
    </SafeAreaView>
  );
}
