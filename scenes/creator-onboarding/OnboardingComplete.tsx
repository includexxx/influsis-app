import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
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
//
// The draft is reset here, not in UsernameStep.onFinish: `completeOnboarding()`
// is what flips `completed` and swaps this screen in, so resetting
// immediately after it would set `completed` back to false and bounce the
// creator to step 1. This is the actual "leaving the wizard" moment — the
// server is now the source of truth, and re-entering `/creator-onboarding`
// afterwards (e.g. from the Profile tab) should start from a blank draft
// rather than replaying stale local photo picks whose `file://` URIs may no
// longer even resolve.
export default function OnboardingComplete() {
  const { dispatch, reset } = useCreatorOnboardingSlice();

  function onDone() {
    dispatch(reset());
    router.replace('/home');
  }

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
          onPress={onDone}
          testID="onboarding-complete-cta"
        />
      </View>
    </ScrollView>
  );
}
