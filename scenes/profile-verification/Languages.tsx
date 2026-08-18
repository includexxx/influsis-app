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

const LANGUAGE_OPTIONS = [
  {
    id: 'english',
    label: 'English',
    icon: require('@/assets/images/profile-verification/flag-english.png'),
  },
  {
    id: 'spanish',
    label: 'Spanish',
    icon: require('@/assets/images/profile-verification/flag-spanish.png'),
  },
  {
    id: 'french',
    label: 'French',
    icon: require('@/assets/images/profile-verification/flag-french.png'),
  },
  {
    id: 'russian',
    label: 'Russian',
    icon: require('@/assets/images/profile-verification/flag-russian.png'),
  },
  {
    id: 'hindi',
    label: 'Hindi',
    icon: require('@/assets/images/profile-verification/flag-hindi.png'),
  },
  {
    id: 'others',
    label: 'Others',
    icon: require('@/assets/images/tab-bar/create-gig.png'),
  },
];

export default function Languages() {
  const { colors } = useTheme();
  const { languages, toggleLanguage, dispatch } = useProfileVerificationSlice();
  const {
    showInput: showOtherInput,
    setShowInput: setShowOtherInput,
    text: otherText,
    setText: setOtherText,
  } = useDebouncedOtherOption(dispatch, toggleLanguage);

  function handleNext() {
    router.push('/profile-verification/bio');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={4}
          totalSteps={TOTAL_STEPS}
          title="What languages are you fluent in?"
          description="Brands seek creators within age ranges for campaign"
          style={profileStepStyle.header}
        />
        <View style={profileStepStyle.optionList}>
          {LANGUAGE_OPTIONS.map(option =>
            option.id === 'others' ? (
              showOtherInput ? (
                <TextField
                  key={option.id}
                  label="Others"
                  placeholder="Enter a language"
                  value={otherText}
                  onChangeText={setOtherText}
                  autoFocus
                  testID="language-other-input"
                />
              ) : (
                <SelectableListItem
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={false}
                  onPress={() => setShowOtherInput(true)}
                  testID={`language-${option.id}`}
                />
              )
            ) : (
              <SelectableListItem
                key={option.id}
                icon={option.icon}
                label={option.label}
                selected={languages.includes(option.id)}
                onPress={() => dispatch(toggleLanguage(option.id))}
                testID={`language-${option.id}`}
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
          disabled={languages.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
