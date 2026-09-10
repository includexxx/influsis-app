import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  contentCategoriesSchema,
  ContentCategoriesValues,
  OTHERS_TEXT_MAX_LENGTH,
} from '@/utils/onboardingSchemas';
import {
  CONTENT_CATEGORY_OPTIONS,
  OTHERS_CATEGORY_VALUE,
  getSubcategories,
} from '@/data/contentCategories';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import ContentCategoryAccordion from '@/components/elements/ContentCategoryAccordion';
import ControlledTextField from '@/components/elements/ControlledTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

type CategoryEntry = ContentCategoriesValues['categories'][number];

// Step 3 of the creator onboarding wizard - Content Categories (requirements
// §3 Screen 3). Multi-select categories; selecting one expands its subcategory
// checklist inline, and each selected category needs >= 1 subcategory before
// `Next` enables. "Others" swaps the checklist for a free-text specify field
// whose value later becomes both a category and a subcategory (build-plan 20g).
export default function ContentCategoriesStep() {
  const { contentCategories, dispatch, saveContentCategories } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<ContentCategoriesValues>({
    resolver: zodResolver(contentCategoriesSchema),
    mode: 'onChange',
    defaultValues: contentCategories ?? { categories: [], othersText: '' },
  });

  // Each category tracks its own open/closed state - the requirements let
  // multiple subcategory lists show at once.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const categories = watch('categories') ?? [];

  const entryFor = (value: string): CategoryEntry | undefined =>
    categories.find(entry => entry.value === value);

  function setCategories(next: CategoryEntry[]) {
    setValue('categories', next, { shouldValidate: true });
  }

  function toggleCategory(value: string) {
    if (entryFor(value)) {
      setCategories(categories.filter(entry => entry.value !== value));
      setExpanded(prev => {
        const { [value]: _drop, ...rest } = prev;
        return rest;
      });
      if (value === OTHERS_CATEGORY_VALUE) {
        setValue('othersText', '', { shouldValidate: true });
      }
      return;
    }
    setCategories([...categories, { value, subcategories: [] }]);
    setExpanded(prev => ({ ...prev, [value]: true }));
  }

  function toggleExpanded(value: string) {
    if (!entryFor(value)) {
      toggleCategory(value);
      return;
    }
    setExpanded(prev => ({ ...prev, [value]: !prev[value] }));
  }

  function toggleSubcategory(categoryValue: string, subValue: string) {
    setCategories(
      categories.map(entry => {
        if (entry.value !== categoryValue) return entry;
        const has = entry.subcategories.includes(subValue);
        return {
          ...entry,
          subcategories: has
            ? entry.subcategories.filter(value => value !== subValue)
            : [...entry.subcategories, subValue],
        };
      }),
    );
  }

  function onSubmit(values: ContentCategoriesValues) {
    dispatch(saveContentCategories(values));
    saveAndContinue();
  }

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={3}
          totalSteps={totalSteps}
          title="What content do you create?"
          description="Pick the categories and subcategories that fit your work"
          onBack={back}
          style={profileStepStyle.header}
        />

        <View style={profileStepStyle.optionList}>
          {CONTENT_CATEGORY_OPTIONS.map(option => {
            const entry = entryFor(option.value);
            const selected = !!entry;
            const isOthers = option.value === OTHERS_CATEGORY_VALUE;
            const missingSubcategory =
              selected && !isOthers && (entry?.subcategories.length ?? 0) === 0;

            return (
              <ContentCategoryAccordion
                key={option.value}
                label={option.label}
                selected={selected}
                expanded={!!expanded[option.value]}
                onToggleSelected={() => toggleCategory(option.value)}
                onToggleExpanded={() => toggleExpanded(option.value)}
                subcategoryOptions={isOthers ? undefined : getSubcategories(option.value)}
                selectedSubcategories={entry?.subcategories ?? []}
                onToggleSubcategory={value => toggleSubcategory(option.value, value)}
                error={missingSubcategory ? 'Pick at least one subcategory' : undefined}
                testID={`onboarding-category-${option.value}`}>
                {isOthers ? (
                  <ControlledTextField
                    control={control}
                    name="othersText"
                    placeholder="Please specify"
                    maxLength={OTHERS_TEXT_MAX_LENGTH}
                    autoCapitalize="none"
                    testID="onboarding-category-others-text"
                  />
                ) : undefined}
              </ContentCategoryAccordion>
            );
          })}
        </View>
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid}
          testID="onboarding-next"
        />
      </View>
    </>
  );
}
