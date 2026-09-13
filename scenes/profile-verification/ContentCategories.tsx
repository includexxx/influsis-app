import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, useDebouncedOtherOption } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useProfileVerificationSlice } from '@/slices';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import SelectableListItem from '@/components/elements/SelectableListItem';
import TextField from '@/components/elements/TextField';

const TOTAL_STEPS = 5;

const CATEGORY_OPTIONS = [
  {
    id: 'education',
    label: 'Education',
    icon: require('@/assets/images/profile-verification/category-education.png'),
  },
  {
    id: 'beauty',
    label: 'Beauty & Life Style',
    icon: require('@/assets/images/profile-verification/category-beauty.png'),
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: require('@/assets/images/profile-verification/category-travel.png'),
  },
  {
    id: 'music',
    label: 'Music',
    icon: require('@/assets/images/profile-verification/category-music.png'),
  },
  {
    id: 'gym',
    label: 'Gym & Body Building',
    icon: require('@/assets/images/profile-verification/category-gym.png'),
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: require('@/assets/images/profile-verification/category-sports.png'),
  },
  {
    id: 'health',
    label: 'Health',
    icon: require('@/assets/images/profile-verification/category-health.png'),
  },
  {
    id: 'others',
    label: 'Others',
    icon: require('@/assets/images/tab-bar/create-gig.png'),
  },
];

export default function ContentCategories() {
  const { colors } = useTheme();
  const { categories, toggleCategory, dispatch } = useProfileVerificationSlice();
  const {
    showInput: showOtherInput,
    setShowInput: setShowOtherInput,
    text: otherText,
    setText: setOtherText,
  } = useDebouncedOtherOption(dispatch, toggleCategory);

  function handleNext() {
    router.push('/profile-verification/social-media');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={2}
          totalSteps={TOTAL_STEPS}
          title="What content do you create?"
          description="Brands seek creators within age ranges for campaign"
          style={profileStepStyle.header}
        />
        <View style={profileStepStyle.optionList}>
          {CATEGORY_OPTIONS.map(option =>
            option.id === 'others' ? (
              showOtherInput ? (
                <TextField
                  key={option.id}
                  label="Others"
                  placeholder="Enter a category"
                  value={otherText}
                  onChangeText={setOtherText}
                  autoFocus
                  testID="category-other-input"
                />
              ) : (
                <SelectableListItem
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={false}
                  onPress={() => setShowOtherInput(true)}
                  testID={`category-${option.id}`}
                />
              )
            ) : (
              <SelectableListItem
                key={option.id}
                icon={option.icon}
                label={option.label}
                selected={categories.includes(option.id)}
                onPress={() => dispatch(toggleCategory(option.id))}
                testID={`category-${option.id}`}
              />
            ),
          )}
        </View>
      </ScrollView>
      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleNext}
          disabled={categories.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
