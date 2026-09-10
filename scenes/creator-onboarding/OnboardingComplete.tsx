import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import SuccessHero from '@/components/elements/SuccessHero';

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 40,
  },
});

// Shown by `CreatorOnboarding` once Finish sets `completed` (build-plan 20g).
// Composed like `WithdrawSuccess` - confetti hero then a single CTA. The
// button is terminal: `authGate` has no onboarding-completion gate, so an
// authenticated creator lands in `(main)` and does not bounce back here.
export default function OnboardingComplete() {
  return (
    <ScrollView
      style={layoutStyle.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <SuccessHero
        title="You're all set"
        description="Your creator profile is ready to go"
        testID="onboarding-complete-hero"
      />
      <View>
        <Button
          title="Explore Influsis"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={() => router.replace('/home')}
          testID="onboarding-complete-cta"
        />
      </View>
    </ScrollView>
  );
}
