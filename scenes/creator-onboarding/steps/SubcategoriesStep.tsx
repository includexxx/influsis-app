import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  subcategoriesStepSchema,
  SubcategoriesStepValues,
  OTHERS_TEXT_MAX_LENGTH,
} from '@/utils/onboardingSchemas';
import {
  CONTENT_CATEGORY_OPTIONS,
  OTHERS_CATEGORY_VALUE,
  getSubcategories,
} from '@/data/contentCategories';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import SelectableRow from '@/components/elements/SelectableRow';
import OnboardingTextField from '@/components/elements/OnboardingTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const categoryLabel = (value: string) =>
  CONTENT_CATEGORY_OPTIONS.find(option => option.value === value)?.label ?? value;

// Step 5 of the creator onboarding wizard - Subcategories (build-plan 20h
// split it out of the old combined Content Categories step, now step 4;
// build-plan 21 shifted both down one for the Bio step). One checklist per
// category picked on step 4; each non-"Others" category needs >= 1 subcategory
// before `Next` enables. The "Others" category contributes a free-text
// subcategory (its value later joins both the category and subcategory lists
// at payload assembly).
export default function SubcategoriesStep() {
  const { colors, palette } = useTheme();
  const { contentCategories, dispatch, saveSubcategories } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<SubcategoriesStepValues>({
    resolver: zodResolver(subcategoriesStepSchema),
    mode: 'onChange',
    defaultValues: {
      categories: contentCategories?.categories ?? [],
      subcategoryOthersText: contentCategories?.subcategoryOthersText ?? '',
    },
  });

  const categories = watch('categories') ?? [];
  const hasCategories = categories.length > 0;

  function toggleSubcategory(categoryValue: string, subValue: string) {
    setValue(
      'categories',
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
      { shouldValidate: true },
    );
  }

  function onSubmit(values: SubcategoriesStepValues) {
    dispatch(saveSubcategories(values));
    saveAndContinue();
  }

  return (
    <OnboardingStepScreen
      step={5}
      totalSteps={totalSteps}
      title="Pick your subcategories"
      description="Choose at least one under each category you selected"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!isValid || !hasCategories}>
      {hasCategories ? (
        <View style={profileStepStyle.fields}>
          {categories.map(entry => {
            const isOthers = entry.value === OTHERS_CATEGORY_VALUE;
            const missing = !isOthers && entry.subcategories.length === 0;

            return (
              <View key={entry.value} style={profileStepStyle.fields}>
                <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
                  {categoryLabel(entry.value)}
                </Text>

                {isOthers ? (
                  <OnboardingTextField
                    control={control}
                    name="subcategoryOthersText"
                    placeholder="Please specify"
                    maxLength={OTHERS_TEXT_MAX_LENGTH}
                    autoCapitalize="none"
                    testID="onboarding-subcategory-others-text"
                  />
                ) : (
                  getSubcategories(entry.value).map(option => (
                    <SelectableRow
                      key={option.value}
                      label={option.label}
                      selected={entry.subcategories.includes(option.value)}
                      onPress={() => toggleSubcategory(entry.value, option.value)}
                      testID={`onboarding-subcategory-${entry.value}-${option.value}`}
                    />
                  ))
                )}

                {missing ? (
                  <Text style={[profileStepStyle.fieldError, { color: colors.error }]}>
                    Pick at least one subcategory
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[profileStepStyle.helperText, { color: palette.gray[300] }]}>
          Go back and pick at least one category first.
        </Text>
      )}
    </OnboardingStepScreen>
  );
}
