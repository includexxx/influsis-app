import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  categoriesStepSchema,
  CategoriesStepValues,
  OTHERS_TEXT_MAX_LENGTH,
} from '@/utils/onboardingSchemas';
import { CONTENT_CATEGORY_OPTIONS, OTHERS_CATEGORY_VALUE } from '@/data/contentCategories';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import SelectableRow from '@/components/elements/SelectableRow';
import OnboardingTextField from '@/components/elements/OnboardingTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 4 of the creator onboarding wizard - Content Categories (build-plan
// 20h split subcategory selection into its own step 5; build-plan 21 shifted
// both down one for the Bio step). Multi-select of the eight categories only;
// "Others" reveals a free-text "Please specify" field whose value later
// becomes both a custom category and a custom subcategory. Subcategories are
// chosen on the next step. Deselecting a category drops its entry (and any
// subcategories it had picked up on step 5).
export default function ContentCategoriesStep() {
  const { colors } = useTheme();
  const { contentCategories, dispatch, saveCategories } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<CategoriesStepValues>({
    resolver: zodResolver(categoriesStepSchema),
    mode: 'onChange',
    defaultValues: {
      categories: contentCategories?.categories ?? [],
      categoryOthersText: contentCategories?.categoryOthersText ?? '',
    },
  });

  const categories = watch('categories') ?? [];
  const selectedValues = categories.map(entry => entry.value);

  function toggleCategory(value: string) {
    if (selectedValues.includes(value)) {
      setValue(
        'categories',
        categories.filter(entry => entry.value !== value),
        { shouldValidate: true },
      );
      if (value === OTHERS_CATEGORY_VALUE) {
        setValue('categoryOthersText', '', { shouldValidate: true });
      }
      return;
    }
    // New entries start with no subcategories; step 4 fills them in.
    setValue('categories', [...categories, { value, subcategories: [] }], { shouldValidate: true });
  }

  function onSubmit(values: CategoriesStepValues) {
    dispatch(saveCategories(values));
    saveAndContinue();
  }

  return (
    <OnboardingStepScreen
      step={4}
      totalSteps={totalSteps}
      title="What content do you create?"
      description="Pick the categories that fit your work"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!isValid}>
      <View style={profileStepStyle.fields}>
        <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
          Categories
        </Text>
        <View style={profileStepStyle.fields}>
          {CONTENT_CATEGORY_OPTIONS.map(option => (
            <View key={option.value}>
              <SelectableRow
                label={option.label}
                selected={selectedValues.includes(option.value)}
                onPress={() => toggleCategory(option.value)}
                testID={`onboarding-category-${option.value}`}
              />
              {option.value === OTHERS_CATEGORY_VALUE &&
              selectedValues.includes(OTHERS_CATEGORY_VALUE) ? (
                <OnboardingTextField
                  control={control}
                  name="categoryOthersText"
                  placeholder="Please specify"
                  maxLength={OTHERS_TEXT_MAX_LENGTH}
                  autoCapitalize="none"
                  containerStyle={profileStepStyle.otherInput}
                  testID="onboarding-category-others-text"
                />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </OnboardingStepScreen>
  );
}
