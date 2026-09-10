import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nanoid } from '@reduxjs/toolkit';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { portfolioFormSchema, PortfolioFormValues } from '@/utils/onboardingSchemas';
import {
  detectPlatform,
  normalizePortfolioUrl,
  PortfolioPlatform,
} from '@/data/portfolioPlatforms';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import AddItemButton from '@/components/elements/AddItemButton';
import PortfolioEntryCard from '@/components/elements/PortfolioEntryCard';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  nudge: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// Step 7 of the creator onboarding wizard - Portfolio (requirements §3
// "Portfolio"). A repeatable, entirely optional list: an empty list passes
// the schema so `Next` is enabled, but a blank/malformed link on an added
// card blocks `Next` until it is fixed or removed. Duplicate links warn but
// never block. Persisted to the draft on submit for the 20g FormData step.
export default function PortfolioStep() {
  const { palette } = useTheme();
  const { portfolio, dispatch, savePortfolio } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const { control, handleSubmit, setValue, watch } = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    mode: 'onChange',
    defaultValues: { entries: portfolio ?? [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
    keyName: '_rhfId',
  });

  // Entry ids whose platform tag the user set by hand - their tag is no
  // longer recomputed from the URL. Component-local, never persisted.
  const [overridden, setOverridden] = useState<Record<string, boolean>>({});

  const entries = watch('entries') ?? [];

  // Validity and per-entry link errors come straight from the schema over the
  // live entries, not `formState` - RHF's `isValid` starts false before the
  // first validation, but an empty list must leave `Next` enabled.
  const parsed = portfolioFormSchema.safeParse({ entries });
  const urlErrors = new Map<number, string>();
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (
        issue.path[0] === 'entries' &&
        issue.path[2] === 'url' &&
        typeof issue.path[1] === 'number'
      ) {
        urlErrors.set(issue.path[1], issue.message);
      }
    }
  }

  function addEntry() {
    append({ id: nanoid(), url: '', platform: 'others', thumbnail: undefined });
  }

  function changeUrl(index: number, url: string) {
    setValue(`entries.${index}.url`, url, { shouldValidate: true });
    if (!overridden[entries[index]?.id]) {
      setValue(`entries.${index}.platform`, detectPlatform(url), { shouldValidate: true });
    }
  }

  function changePlatform(index: number, platform: PortfolioPlatform) {
    const id = entries[index]?.id;
    if (id) setOverridden(prev => ({ ...prev, [id]: true }));
    setValue(`entries.${index}.platform`, platform, { shouldValidate: true });
  }

  function isDuplicate(index: number): boolean {
    const key = normalizePortfolioUrl(entries[index]?.url ?? '');
    if (!key) return false;
    return entries.slice(0, index).some(entry => normalizePortfolioUrl(entry.url) === key);
  }

  function onSubmit(values: PortfolioFormValues) {
    dispatch(savePortfolio(values.entries));
    saveAndContinue();
  }

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={7}
          totalSteps={totalSteps}
          title="Show your best work"
          description="Add a few links to content you're proud of - optional, but it helps you stand out"
          onBack={back}
          style={profileStepStyle.header}
        />

        <View style={styles.list}>
          {fields.map((field, index) => (
            <PortfolioEntryCard
              key={field._rhfId}
              entry={entries[index] ?? field}
              index={index}
              onChangeUrl={url => changeUrl(index, url)}
              onChangePlatform={platform => changePlatform(index, platform)}
              onChangeThumbnail={asset =>
                setValue(`entries.${index}.thumbnail`, asset, { shouldValidate: true })
              }
              onDelete={() => remove(index)}
              urlError={urlErrors.get(index)}
              duplicate={isDuplicate(index)}
              testID={`onboarding-portfolio-${index}`}
            />
          ))}

          <AddItemButton
            label={fields.length === 0 ? 'Add Portfolio' : 'Add Another'}
            onPress={addEntry}
            testID="onboarding-portfolio-add"
          />

          {fields.length === 0 ? (
            <Text style={[styles.nudge, { color: palette.gray[300] }]}>
              Adding at least one sample helps you get 3x more responses.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit(onSubmit)}
          disabled={!parsed.success}
          testID="onboarding-next"
        />
      </View>
    </>
  );
}
