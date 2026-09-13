import { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useTheme, useHandleAvailability } from '@/hooks';
import type { HandleAvailabilityState } from '@/hooks';
import { spacing } from '@/theme';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';
import { usernameFormSchema, UsernameFormValues } from '@/utils/onboardingSchemas';
import { generateHandleSuggestions } from '@/data/handleSuggestions';
import { buildCreatorOnboardingBody } from '@/utils/onboardingPayload';
import { profileSubmitErrorMessage, handleConflictMessage } from '@/utils/profileErrors';
import { useOnboardCreatorMutation } from '@/services/profilesApi';
import { uploadOnboardingMedia } from '@/services/mediaUpload';
import { authApi } from '@/services/authApi';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import TextField from '@/components/elements/TextField';
import CategoryChip from '@/components/elements/CategoryChip';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 20,
  },
  suggestions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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

// Step 10 of the creator onboarding wizard - Username + Finish
// (creator-onboarding-requirements.md §3 "Username"; step 10 after build-plan
// 20h split Categories/Subcategories and 21 added the Bio step). An `@`-prefixed handle
// with client-side format rules, a debounced live availability check against
// the public handle-availability endpoint, auto-suggested alternatives when a
// handle is taken, and a Finish CTA that uploads any locally-picked photos,
// submits the whole draft to `POST /profiles/onboarding-creator`, and only
// then hands off to the completion screen — a failed submit leaves the
// creator on this step with their draft intact.
export default function UsernameStep() {
  const { colors, palette } = useTheme();
  const slice = useCreatorOnboardingSlice();
  const { totalSteps, back } = useCreatorOnboardingStep();
  const [isHandleFocused, setIsHandleFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [handleError, setHandleError] = useState<string>();
  const [onboardCreator, { isLoading: isSubmittingProfile }] = useOnboardCreatorMutation();

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

  const isSubmitting = isUploading || isSubmittingProfile;
  const canFinish = formatValid && state === 'available' && !handleError;
  // A 409 the debounced availability check missed (someone else claimed it a
  // moment ago) should still offer alternatives, same as a normal 'taken'.
  const showSuggestions = state === 'taken' || state === 'reserved' || !!handleError;
  const suggestions = showSuggestions
    ? generateHandleSuggestions(slice.basics?.name, slice.location?.city, handle)
    : [];

  function changeHandle(text: string) {
    const next = text.replace(/^@+/, '').toLowerCase();
    setValue('handle', next, { shouldValidate: true });
    setHandleError(undefined);
  }

  async function onFinish() {
    if (isSubmitting) return;
    setSubmitError(undefined);
    setHandleError(undefined);
    slice.dispatch(slice.saveHandle(handle));

    const submissionState: CreatorOnboardingState = {
      currentStep: slice.currentStep,
      completedSteps: slice.completedSteps,
      completed: slice.completed,
      basics: slice.basics,
      bio: slice.bio,
      location: slice.location,
      contentCategories: slice.contentCategories,
      languages: slice.languages,
      deliverables: slice.deliverables,
      profilePhoto: slice.profilePhoto,
      coverPhoto: slice.coverPhoto,
      portfolio: slice.portfolio,
      handle,
    };

    try {
      setIsUploading(true);
      const media = await uploadOnboardingMedia(submissionState);
      setIsUploading(false);

      await onboardCreator(buildCreatorOnboardingBody(submissionState, media)).unwrap();

      // GET /auth/me also returns `handle` and a profile summary — a
      // different createApi instance, so it isn't invalidated automatically.
      slice.dispatch(authApi.util.invalidateTags(['Me']));
      slice.dispatch(slice.completeOnboarding());
    } catch (err) {
      setIsUploading(false);
      const conflict = handleConflictMessage(err);
      if (conflict) {
        setHandleError(conflict);
        return;
      }
      setSubmitError(profileSubmitErrorMessage(err));
    }
  }

  const statusColor =
    state === 'available'
      ? colors.success
      : state === 'taken' || state === 'reserved' || state === 'invalid'
        ? colors.error
        : palette.gray[300];

  return (
    <OnboardingStepScreen
      step={10}
      totalSteps={totalSteps}
      title="Claim your username"
      description="This is your public handle - platform.com/@you. It doesn't change if you rename your profile later."
      onBack={back}
      onNext={onFinish}
      nextDisabled={!canFinish || isSubmitting}
      nextLoading={isSubmitting}
      nextLabel="Finish"
      footerSlot={
        submitError ? (
          <Text
            style={[profileStepStyle.helperText, { color: colors.error }]}
            testID="onboarding-submit-error">
            {submitError}
          </Text>
        ) : undefined
      }>
      <Controller
        control={control}
        name="handle"
        render={({ field, fieldState }) => (
          <TextField
            label="Username"
            value={field.value}
            onChangeText={changeHandle}
            onFocus={() => setIsHandleFocused(true)}
            onBlur={() => {
              setIsHandleFocused(false);
              field.onBlur();
            }}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            error={fieldState.error?.message ?? handleError}
            inputRowStyle={
              isHandleFocused && !fieldState.error
                ? { borderColor: palette.primary[400] }
                : undefined
            }
            leftAdornment={
              <Text style={[profileStepStyle.usernamePrefix, { color: palette.gray[900] }]}>@</Text>
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
            style={[profileStepStyle.helperText, { color: statusColor }]}
            testID="onboarding-handle-status">
            {STATUS_COPY[state]}
          </Text>
        </View>
      ) : null}

      {showSuggestions && suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={[profileStepStyle.helperText, { color: palette.gray[300] }]}>
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
    </OnboardingStepScreen>
  );
}
