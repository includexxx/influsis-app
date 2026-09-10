import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useTheme, useHandleAvailability } from '@/hooks';
import type { HandleAvailabilityState } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';
import { usernameFormSchema, UsernameFormValues } from '@/utils/onboardingSchemas';
import { generateHandleSuggestions } from '@/data/handleSuggestions';
import { buildOnboardingSubmission } from '@/utils/onboardingPayload';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import TextField from '@/components/elements/TextField';
import CategoryChip from '@/components/elements/CategoryChip';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    minHeight: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestions: {
    marginTop: 16,
    gap: 8,
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

// Copy for the debounced availability indicator under the handle field.
const STATUS_COPY: Record<Exclude<HandleAvailabilityState, 'idle'>, string> = {
  checking: 'Checking...',
  available: 'Available',
  taken: 'That handle is taken',
  reserved: 'That handle is reserved',
  invalid: 'Check that format',
  error: "Couldn't check right now",
};

// Step 8 of the creator onboarding wizard - Username + Finish
// (creator-onboarding-requirements.md §3 "Username"). An `@`-prefixed handle
// with client-side format rules, a debounced live availability check against
// the one public endpoint this app calls, auto-suggested alternatives when a
// handle is taken, and a Finish CTA that assembles + logs the submission
// draft (no network submit - there is no create-profile endpoint yet) and
// hands off to the completion screen.
export default function UsernameStep() {
  const { colors, palette } = useTheme();
  const slice = useCreatorOnboardingSlice();
  const { totalSteps, back } = useCreatorOnboardingStep();

  const {
    control,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    mode: 'onChange',
    defaultValues: { handle: slice.handle ?? '' },
  });

  const handle = watch('handle') ?? '';
  // Parse straight from the schema rather than trusting RHF's `isValid`,
  // which is `false` until the first change even for a prefilled valid draft.
  const formatValid = usernameFormSchema.safeParse({ handle }).success || isValid;
  const { state } = useHandleAvailability(handle, formatValid);

  const canFinish = formatValid && state === 'available';
  const showSuggestions = state === 'taken' || state === 'reserved';
  const suggestions = showSuggestions
    ? generateHandleSuggestions(slice.basics?.name, slice.location?.city, handle)
    : [];

  function changeHandle(text: string) {
    const next = text.replace(/^@+/, '').toLowerCase();
    setValue('handle', next, { shouldValidate: true });
  }

  function onFinish() {
    slice.dispatch(slice.saveHandle(handle));
    const submissionState: CreatorOnboardingState = {
      currentStep: slice.currentStep,
      completedSteps: slice.completedSteps,
      completed: slice.completed,
      basics: slice.basics,
      location: slice.location,
      contentCategories: slice.contentCategories,
      languages: slice.languages,
      deliverables: slice.deliverables,
      profilePhoto: slice.profilePhoto,
      coverPhoto: slice.coverPhoto,
      portfolio: slice.portfolio,
      handle,
    };
    const { summary } = buildOnboardingSubmission(submissionState);
    // Required by build-plan 20g: there is no submit endpoint, so Finish
    // logs a readable summary of the assembled payload and stops.
    // eslint-disable-next-line no-console
    console.log('[creator-onboarding] submission', summary);
    slice.dispatch(slice.completeOnboarding());
  }

  const statusColor =
    state === 'available'
      ? colors.success
      : state === 'taken' || state === 'reserved' || state === 'invalid'
        ? colors.error
        : palette.gray[300];

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={8}
          totalSteps={totalSteps}
          title="Claim your username"
          description="This is your public handle - platform.com/@you. It doesn't change if you rename your profile later."
          onBack={back}
          style={profileStepStyle.header}
        />

        <Controller
          control={control}
          name="handle"
          render={({ field, fieldState }) => (
            <TextField
              value={field.value}
              onChangeText={changeHandle}
              onBlur={field.onBlur}
              placeholder="yourname"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              error={fieldState.error?.message}
              leftAdornment={
                <Text style={[profileStepStyle.usernamePrefix, { color: palette.gray[900] }]}>
                  @
                </Text>
              }
              testID="onboarding-handle"
            />
          )}
        />

        {formatValid && state !== 'idle' ? (
          <View style={styles.statusRow}>
            {state === 'checking' ? (
              <ActivityIndicator size="small" color={palette.gray[300]} />
            ) : (
              <Feather name={state === 'available' ? 'check' : 'x'} size={16} color={statusColor} />
            )}
            <Text
              style={[styles.statusText, { color: statusColor }]}
              testID="onboarding-handle-status">
              {STATUS_COPY[state]}
            </Text>
          </View>
        ) : null}

        {showSuggestions && suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            <Text style={[styles.suggestionsLabel, { color: palette.gray[300] }]}>
              Try one of these:
            </Text>
            <View style={styles.chipRow}>
              {suggestions.map(suggestion => (
                <CategoryChip
                  key={suggestion}
                  label={`@${suggestion}`}
                  onPress={() => changeHandle(suggestion)}
                  testID={`onboarding-handle-suggestion-${suggestion}`}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Finish"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={onFinish}
          disabled={!canFinish}
          testID="onboarding-next"
        />
      </View>
    </>
  );
}
